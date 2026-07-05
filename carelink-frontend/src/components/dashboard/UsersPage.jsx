import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../api/client';
import NotificationBell from '../NotificationBell';
import EmptyState from '../ui/EmptyState';

const ROLE_LABELS = {
  admin: 'Admin',
  health_worker: 'Health Worker',
  user: 'User',
};

function UserAvatar({ user }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-semibold text-gray-500">
      {user.firstName?.[0]}
      {user.lastName?.[0]}
    </div>
  );
}

function NotSetupBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-orange-600">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      NOT SETUP
    </span>
  );
}

function StatusCheck() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const filterRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.users({ limit: 100 });
      setUsers(res.data.users || []);
    } catch {
      setMsg('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const close = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === 'active' && u.role === 'health_worker' && !u.isVerified) return false;
      if (statusFilter === 'pending' && !(u.role === 'health_worker' && !u.isVerified)) return false;
      if (!q) return true;
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      return name.includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [users, search, statusFilter]);

  const verifyWorker = async (id) => {
    setBusy(id);
    try {
      await api.verifyWorker(id);
      setMsg('Health worker verified');
      load();
    } finally {
      setBusy('');
    }
  };

  const exportCsv = () => {
    const header = 'Name,Email,Role,Verification,Credits\n';
    const rows = filtered.map((u) => {
      const ver = u.role === 'health_worker' ? (u.isVerified ? 'Verified' : 'Not setup') : '—';
      return `"${u.firstName} ${u.lastName}",${u.email},${ROLE_LABELS[u.role]},${ver},${u.healthCredits ?? 0}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carelink-users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterLabel = {
    all: 'All statuses',
    active: 'Active only',
    pending: 'Pending only',
  }[statusFilter];

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Header */}
      <div className="px-8 pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] text-gray-400">Dashboard / Users</p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight text-gray-900">Platform Users</h1>
          </div>
          <NotificationBell />
        </div>

      </div>

      {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 px-8 py-5">
            <div className="flex min-w-[280px] flex-1 max-w-xl">
              <input
                type="text"
                placeholder="Search for users"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 flex-1 rounded-l-lg border border-r-0 border-gray-200 px-4 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            <span className="text-[14px] text-gray-400">{filtered.length} items total</span>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Reports
              </button>

              <div className="relative" ref={filterRef}>
                <button
                  type="button"
                  onClick={() => setFilterOpen((v) => !v)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>

                {filterOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {[
                      { id: 'all', label: 'All statuses' },
                      { id: 'active', label: 'Active only' },
                      { id: 'pending', label: 'Pending only' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setStatusFilter(opt.id); setFilterOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] ${
                          statusFilter === opt.id ? 'bg-gray-50 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                          statusFilter === opt.id ? 'border-gray-800 bg-gray-800' : 'border-gray-300'
                        }`}>
                          {statusFilter === opt.id && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {msg && <p className="px-8 text-[12px] text-gray-500">{msg}</p>}

          {/* Table */}
          <div className="flex-1 px-8">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState message="No users found" />
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        Name
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </th>
                    <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">Institution</th>
                    <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">Role</th>
                    <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">Payout Status</th>
                    <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">Commission</th>
                    <th className="pb-2 text-[13px] font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={u} />
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold text-gray-900">
                              {u.firstName} {u.lastName}
                              {u.role === 'admin' && (
                                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                                  Admin
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[12px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-4 text-[14px] text-gray-600">Platform</td>
                      <td className="py-2 pr-4 text-[14px] text-gray-600">{ROLE_LABELS[u.role] || u.role}</td>
                      <td className="py-2 pr-4">
                        {u.role === 'health_worker' && !u.isVerified ? (
                          <div className="flex items-center gap-2">
                            <NotSetupBadge />
                            <button
                              type="button"
                              disabled={busy === u.id}
                              onClick={() => verifyWorker(u.id)}
                              className="text-[12px] font-medium text-gray-500 underline hover:text-gray-800 disabled:opacity-50"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[14px] text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {(u.healthCredits ?? 0) > 0 ? (
                          <span className="text-[14px] font-medium text-brand-orange">{u.healthCredits} credits</span>
                        ) : (
                          <span className="text-[14px] font-medium text-brand-orange">% Default</span>
                        )}
                      </td>
                      <td className="py-2">
                        <StatusCheck />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-center gap-3 border-t border-gray-100 px-8 py-4">
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-orange"
                style={{ width: `${Math.min(100, (filtered.length / Math.max(users.length, 1)) * 100)}%` }}
              />
            </div>
            <span className="text-[12px] text-gray-400">
              CareLink users: {filtered.length} shown · Filter: {filterLabel}
            </span>
          </div>
    </div>
  );
}
