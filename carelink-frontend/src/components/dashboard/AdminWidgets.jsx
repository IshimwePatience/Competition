import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminWidgets() {
  const [analytics, setAnalytics] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'clinic', address: '', latitude: -1.29, longitude: 36.82 });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [aRes, wRes] = await Promise.all([
      api.analytics(),
      api.users({ role: 'health_worker' }),
    ]);
    setAnalytics(aRes.data);
    setWorkers((wRes.data.users || []).filter((u) => !u.isVerified));
  };

  useEffect(() => { load(); }, []);

  const verifyWorker = async (id) => {
    await api.verifyWorker(id);
    setMsg('Health worker verified');
    load();
  };

  const addFacility = async () => {
    await api.createFacility(form);
    setMsg('Facility created');
    setForm({ name: '', type: 'clinic', address: '', latitude: -1.29, longitude: 36.82 });
    load();
  };

  if (!analytics) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
      <h3 className="text-sm font-bold text-purple-800">Admin Panel</h3>
      {msg && <p className="text-xs text-purple-600">{msg}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Users', value: analytics.totals.users },
          { label: 'Facilities', value: analytics.totals.facilities },
          { label: 'Open Now', value: analytics.totals.openFacilities },
          { label: 'Pending Reports', value: analytics.totals.pendingReports },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Health Worker Approvals</p>
        {workers.length === 0 ? (
          <p className="text-sm text-gray-400">No pending approvals</p>
        ) : (
          workers.map((w) => (
            <div key={w.id} className="mb-2 flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <p className="text-sm">{w.firstName} {w.lastName} — {w.email}</p>
              <button type="button" onClick={() => verifyWorker(w.id)} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs text-white">Approve</button>
            </div>
          ))
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Add Facility</p>
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border px-3 py-2 text-sm">
            <option value="pharmacy">Pharmacy</option>
            <option value="clinic">Clinic</option>
            <option value="hospital">Hospital</option>
            <option value="emergency">Emergency</option>
          </select>
          <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2 rounded-lg border px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={addFacility} className="mt-2 rounded-lg bg-purple-600 px-4 py-2 text-xs text-white">Add Facility</button>
      </div>
    </div>
  );
}
