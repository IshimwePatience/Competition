import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  DataTable,
  TableActionButton,
  TableCell,
  TableEmpty,
  TablePanel,
  TablePrimaryCell,
  TableRow,
  StatusBadge,
} from '../ui/DataTable';
import EmptyState from '../ui/EmptyState';

export default function AdminWidgets({ page = 'facilities' }) {
  const [analytics, setAnalytics] = useState(null);
  const [pendingReports, setPendingReports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (page === 'facilities') {
        const fRes = await api.facilities({ limit: 50 });
        setFacilities(Array.isArray(fRes.data) ? fRes.data : (fRes.data?.facilities || []));
        return;
      }

      const fetches = [api.analytics()];

      if (page === 'reports') {
        fetches.push(api.reports({ status: 'pending', limit: 20 }));
      }

      const results = await Promise.all(fetches);
      const aRes = results[0];
      setAnalytics(aRes.data);

      if (page === 'reports') {
        const rRes = results[1];
        setPendingReports(rRes.data.reports || []);
      }
    } catch {
      setMsg('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const verifyReport = async (id) => {
    setBusy(`report-v-${id}`);
    try {
      await api.verifyReport(id);
      flash('Report verified — facility updated');
      load();
    } finally {
      setBusy('');
    }
  };

  const rejectReport = async (id) => {
    setBusy(`report-r-${id}`);
    try {
      await api.rejectReport(id);
      flash('Report rejected');
      load();
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (page === 'facilities') {
    if (facilities.length === 0) {
      return <EmptyState message="No facilities yet" />;
    }

    return (
      <TablePanel title="Facilities" subtitle="Registered clinics and pharmacies" count={facilities.length}>
        <DataTable
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'type', label: 'Type' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status' },
          ]}
        >
          {facilities.map((f) => (
            <TableRow key={f.id}>
              <TablePrimaryCell title={f.name} subtitle={f.address} />
              <TableCell className="capitalize">{f.type}</TableCell>
              <TableCell>{f.phone || '—'}</TableCell>
              <TableCell>
                <StatusBadge
                  status={f.isOpen ? 'open' : 'closed'}
                  label={f.isOpen ? 'Open' : 'Closed'}
                />
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      </TablePanel>
    );
  }

  if (!analytics) return null;

  const showStats = page === 'reports';
  const showReports = page === 'reports';
  const showBreakdown = page === 'reports';

  const stats = [
    { label: 'Users', value: analytics.totals.users },
    { label: 'Facilities', value: analytics.totals.facilities },
    { label: 'Open Now', value: analytics.totals.openFacilities },
    { label: 'Pending Reports', value: analytics.totals.pendingReports },
    { label: 'Credits Issued', value: analytics.totals.creditsIssued },
  ];

  return (
    <div className="space-y-8">
      <h3 className="text-[18px] font-bold text-gray-900">Admin Panel</h3>
      {msg && <p className="text-[12px] text-gray-500">{msg}</p>}

      {showStats && (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[12px] text-gray-400">{s.label}</p>
              <p className="mt-1 text-[24px] font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {showBreakdown && (
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-[13px] font-semibold text-gray-600">Users by Role</p>
            {(analytics.usersByRole || []).map((r) => (
              <div key={r.role} className="flex justify-between border-b border-gray-100 py-2 text-[14px]">
                <span className="capitalize text-gray-600">{r.role?.replace('_', ' ')}</span>
                <span className="font-semibold text-gray-900">{r.count}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-3 text-[13px] font-semibold text-gray-600">Facilities by Type</p>
            {(analytics.facilitiesByType || []).length === 0 ? (
              <EmptyState message="No facilities yet" compact />
            ) : (
              analytics.facilitiesByType.map((f) => (
                <div key={f.type} className="flex justify-between border-b border-gray-100 py-2 text-[14px]">
                  <span className="capitalize text-gray-600">{f.type}</span>
                  <span className="font-semibold text-gray-900">{f.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showReports && (
        <TablePanel
          title="Pending Community Reports"
          subtitle="Community status updates awaiting admin review"
          count={pendingReports.length}
        >
          {pendingReports.length === 0 ? (
            <TableEmpty message="No pending reports — community data is up to date" />
          ) : (
            <DataTable
              columns={[
                { key: 'facility', label: 'Facility', sortable: true },
                { key: 'reporter', label: 'Reporter' },
                { key: 'details', label: 'Details' },
                { key: 'actions', label: 'Actions' },
              ]}
            >
              {pendingReports.map((r) => (
                <TableRow key={r.id}>
                  <TablePrimaryCell
                    title={r.facility?.name}
                    subtitle={r.notes || `${r.isOpen ? 'Open' : 'Closed'} · ${r.waitTimeMinutes}min · ${r.crowdLevel} crowd`}
                  />
                  <TableCell>
                    {r.reporter?.firstName} {r.reporter?.lastName}
                  </TableCell>
                  <TableCell className="text-[13px] text-gray-400">
                    {r.isOpen ? 'Open' : 'Closed'}, {r.waitTimeMinutes}min wait, {r.crowdLevel} crowd
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <TableActionButton
                        variant="primary"
                        disabled={!!busy}
                        onClick={() => verifyReport(r.id)}
                      >
                        Verify
                      </TableActionButton>
                      <TableActionButton
                        variant="danger"
                        disabled={!!busy}
                        onClick={() => rejectReport(r.id)}
                      >
                        Reject
                      </TableActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}
        </TablePanel>
      )}
    </div>
  );
}
