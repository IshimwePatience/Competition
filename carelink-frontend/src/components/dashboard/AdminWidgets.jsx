import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import {
  DataTable,
  TableActionButton,
  TableAvatar,
  TableCell,
  TableEmpty,
  TablePanel,
  TablePrimaryCell,
  TableRow,
} from '../ui/DataTable';

const FACILITY_TYPES = ['pharmacy', 'clinic', 'hospital', 'emergency'];

const defaultFacilityForm = () => ({
  name: '',
  type: 'clinic',
  address: '',
  phone: '',
  latitude: -1.2921,
  longitude: 36.8219,
  isOpen: true,
});

export default function AdminWidgets({ page = 'facilities' }) {
  const [analytics, setAnalytics] = useState(null);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [form, setForm] = useState(defaultFacilityForm());
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetches = [api.analytics()];

      if (page === 'facilities') {
        fetches.push(api.users({ role: 'health_worker', limit: 50 }), api.facilities({ limit: 50 }));
      }
      if (page === 'reports') {
        fetches.push(api.reports({ status: 'pending', limit: 20 }));
      }

      const results = await Promise.all(fetches);
      const aRes = results[0];
      setAnalytics(aRes.data);

      if (page === 'facilities') {
        const wRes = results[1];
        const fRes = results[2];
        setPendingWorkers((wRes.data.users || []).filter((u) => !u.isVerified));
        setFacilities(Array.isArray(fRes.data) ? fRes.data : (fRes.data?.facilities || []));
      }
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

  const verifyWorker = async (id) => {
    setBusy(`worker-${id}`);
    try {
      await api.verifyWorker(id);
      flash('Health worker verified');
      load();
    } finally {
      setBusy('');
    }
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

  const addFacility = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      flash('Name and address are required');
      return;
    }
    setBusy('facility-add');
    try {
      await api.createFacility(form);
      flash('Facility created');
      setForm(defaultFacilityForm());
      load();
    } catch (err) {
      flash(err.message || 'Failed to create facility');
    } finally {
      setBusy('');
    }
  };

  const removeFacility = async (id) => {
    setBusy(`facility-d-${id}`);
    try {
      await api.deleteFacility(id);
      flash('Facility removed');
      load();
    } finally {
      setBusy('');
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
      () => flash('Could not get location')
    );
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  if (!analytics) return null;

  const showStats = page === 'facilities' || page === 'reports';
  const showReports = page === 'reports';
  const showFacilities = page === 'facilities';
  const showWorkers = page === 'facilities';
  const showBreakdown = page === 'facilities' || page === 'reports';

  const stats = [
    { label: 'Users', value: analytics.totals.users },
    { label: 'Facilities', value: analytics.totals.facilities },
    { label: 'Open Now', value: analytics.totals.openFacilities },
    { label: 'Pending Reports', value: analytics.totals.pendingReports },
    { label: 'Triage Sessions', value: analytics.totals.triageSessions },
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
              <p className="text-[14px] text-gray-400">No facilities yet</p>
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

      {showWorkers && (
        <TablePanel
          title="Health Worker Approvals"
          subtitle="Pending health worker verification requests"
          count={pendingWorkers.length}
        >
          {pendingWorkers.length === 0 ? (
            <TableEmpty message="No pending approvals" />
          ) : (
            <DataTable
              columns={[
                { key: 'name', label: 'Name', sortable: true },
                { key: 'action', label: 'Action' },
              ]}
            >
              {pendingWorkers.map((w) => {
                const initials = `${w.firstName?.[0] || ''}${w.lastName?.[0] || ''}`.toUpperCase() || '?';
                return (
                  <TableRow key={w.id}>
                    <TablePrimaryCell
                      title={`${w.firstName} ${w.lastName}`}
                      subtitle={w.email}
                      avatar={<TableAvatar>{initials}</TableAvatar>}
                    />
                    <TableCell>
                      <TableActionButton
                        variant="primary"
                        disabled={busy === `worker-${w.id}`}
                        onClick={() => verifyWorker(w.id)}
                      >
                        Approve
                      </TableActionButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </TablePanel>
      )}

      {showFacilities && (
        <>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Add Facility</p>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
                {FACILITY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2 rounded-lg border px-3 py-2 text-sm" />
              <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <input type="checkbox" checked={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.checked })} />
                Open now
              </label>
              <input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: +e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
              <input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: +e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={useMyLocation} className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">Use my location</button>
              <button type="button" disabled={busy === 'facility-add'} onClick={addFacility} className="rounded-lg bg-gray-800 px-4 py-2 text-xs text-white disabled:opacity-50">Add Facility</button>
            </div>
          </div>

          <TablePanel title="Manage Facilities" subtitle="All registered clinics and pharmacies" count={facilities.length}>
            {facilities.length === 0 ? (
              <TableEmpty message="No facilities — add your first clinic or pharmacy above" />
            ) : (
              <DataTable
                columns={[
                  { key: 'name', label: 'Name', sortable: true },
                  { key: 'type', label: 'Type' },
                  { key: 'status', label: 'Status' },
                  { key: 'action', label: 'Action' },
                ]}
              >
                {facilities.map((f) => (
                  <TableRow key={f.id}>
                    <TablePrimaryCell
                      title={f.name}
                      subtitle={f.address}
                    />
                    <TableCell className="capitalize">{f.type}</TableCell>
                    <TableCell>
                      {f.isOpen ? 'Open' : 'Closed'}
                      {f.waitTimeMinutes != null ? ` · ${f.waitTimeMinutes}min wait` : ''}
                    </TableCell>
                    <TableCell>
                      <TableActionButton
                        variant="danger"
                        disabled={busy === `facility-d-${f.id}`}
                        onClick={() => removeFacility(f.id)}
                      >
                        Delete
                      </TableActionButton>
                    </TableCell>
                  </TableRow>
                ))}
              </DataTable>
            )}
          </TablePanel>
        </>
      )}
    </div>
  );
}
