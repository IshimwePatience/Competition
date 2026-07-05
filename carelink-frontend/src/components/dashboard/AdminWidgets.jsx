import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';

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

export default function AdminWidgets({ activeSection = 'facilities' }) {
  const [analytics, setAnalytics] = useState(null);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(defaultFacilityForm());
  const [campaign, setCampaign] = useState({ title: '', message: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, wRes, rRes, fRes, uRes] = await Promise.all([
        api.analytics(),
        api.users({ role: 'health_worker', limit: 50 }),
        api.reports({ status: 'pending', limit: 20 }),
        api.facilities({ limit: 50 }),
        api.users({ limit: 50 }),
      ]);
      setAnalytics(aRes.data);
      setPendingWorkers((wRes.data.users || []).filter((u) => !u.isVerified));
      setPendingReports(rRes.data.reports || []);
      setFacilities(Array.isArray(fRes.data) ? fRes.data : (fRes.data?.facilities || []));
      setUsers(uRes.data.users || []);
    } catch {
      setMsg('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

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

  const sendCampaign = async () => {
    if (!campaign.title.trim() || !campaign.message.trim()) {
      flash('Campaign title and message are required');
      return;
    }
    setBusy('campaign');
    try {
      const res = await api.createCampaign(campaign);
      flash(`Campaign sent to ${res.data.count} users`);
      setCampaign({ title: '', message: '' });
    } catch (err) {
      flash(err.message || 'Failed to send campaign');
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
      <div className="flex h-48 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!analytics) return null;

  const showStats = true;
  const showReports = activeSection === 'reports';
  const showFacilities = activeSection === 'facilities';
  const showUsers = activeSection === 'reports';
  const showWorkers = activeSection === 'facilities';
  const showCampaign = activeSection === 'triage';
  const showBreakdown = activeSection !== 'triage';

  const stats = [
    { label: 'Users', value: analytics.totals.users },
    { label: 'Facilities', value: analytics.totals.facilities },
    { label: 'Open Now', value: analytics.totals.openFacilities },
    { label: 'Pending Reports', value: analytics.totals.pendingReports },
    { label: 'Triage Sessions', value: analytics.totals.triageSessions },
    { label: 'Credits Issued', value: analytics.totals.creditsIssued },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
      <h3 className="text-sm font-bold text-purple-800">Admin Panel</h3>
      {msg && <p className="rounded-lg bg-white px-3 py-2 text-xs text-purple-600">{msg}</p>}

      {showStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white p-3 shadow-sm">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {showBreakdown && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Users by Role</p>
            {(analytics.usersByRole || []).map((r) => (
              <div key={r.role} className="flex justify-between text-sm">
                <span className="capitalize text-gray-600">{r.role?.replace('_', ' ')}</span>
                <span className="font-semibold">{r.count}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Facilities by Type</p>
            {(analytics.facilitiesByType || []).length === 0 ? (
              <p className="text-sm text-gray-400">No facilities yet</p>
            ) : (
              analytics.facilitiesByType.map((f) => (
                <div key={f.type} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-600">{f.type}</span>
                  <span className="font-semibold">{f.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showReports && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Pending Community Reports ({pendingReports.length})
          </p>
          {pendingReports.length === 0 ? (
            <p className="text-sm text-gray-400">No pending reports — community data is up to date</p>
          ) : (
            <div className="space-y-2">
              {pendingReports.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{r.facility?.name}</p>
                    <p className="text-xs text-gray-400">
                      {r.reporter?.firstName} {r.reporter?.lastName} —{' '}
                      {r.isOpen ? 'Open' : 'Closed'}, {r.waitTimeMinutes}min wait, {r.crowdLevel} crowd
                    </p>
                    {r.notes && <p className="text-xs text-gray-500">{r.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => verifyReport(r.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => rejectReport(r.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showWorkers && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Health Worker Approvals ({pendingWorkers.length})
          </p>
          {pendingWorkers.length === 0 ? (
            <p className="text-sm text-gray-400">No pending approvals</p>
          ) : (
            pendingWorkers.map((w) => (
              <div key={w.id} className="mb-2 flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <p className="text-sm">{w.firstName} {w.lastName} — {w.email}</p>
                <button
                  type="button"
                  disabled={busy === `worker-${w.id}`}
                  onClick={() => verifyWorker(w.id)}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
                >
                  Approve
                </button>
              </div>
            ))
          )}
        </div>
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
              <button type="button" onClick={useMyLocation} className="rounded-lg border border-purple-200 px-4 py-2 text-xs text-purple-700">Use my location</button>
              <button type="button" disabled={busy === 'facility-add'} onClick={addFacility} className="rounded-lg bg-purple-600 px-4 py-2 text-xs text-white disabled:opacity-50">Add Facility</button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Manage Facilities ({facilities.length})</p>
            {facilities.length === 0 ? (
              <p className="text-sm text-gray-400">No facilities — add your first clinic or pharmacy above</p>
            ) : (
              <div className="space-y-2">
                {facilities.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-xs capitalize text-gray-400">{f.type} — {f.address}</p>
                      <p className="text-xs text-gray-400">{f.isOpen ? 'Open' : 'Closed'}{f.waitTimeMinutes != null ? ` · ${f.waitTimeMinutes}min wait` : ''}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busy === `facility-d-${f.id}`}
                      onClick={() => removeFacility(f.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showUsers && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Platform Users ({users.length})</p>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                  u.role === 'health_worker' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {u.role?.replace('_', ' ')}{u.role === 'health_worker' && !u.isVerified ? ' (pending)' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCampaign && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Broadcast Campaign</p>
          <p className="mb-2 text-xs text-gray-400">Send health alerts or screening announcements to all users</p>
          <div className="space-y-2">
            <input placeholder="Campaign title" value={campaign.title} onChange={(e) => setCampaign({ ...campaign, title: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <textarea placeholder="Message to community..." value={campaign.message} onChange={(e) => setCampaign({ ...campaign, message: e.target.value })} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <button type="button" disabled={busy === 'campaign'} onClick={sendCampaign} className="rounded-lg bg-purple-600 px-4 py-2 text-xs text-white disabled:opacity-50">Send to All Users</button>
          </div>
        </div>
      )}
    </div>
  );
}
