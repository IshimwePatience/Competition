import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function WorkerWidgets() {
  const [pending, setPending] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ isOpen: true, waitTimeMinutes: 15, crowdLevel: 'moderate' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [repRes, facRes] = await Promise.all([
      api.reports({ status: 'pending', limit: 10 }),
      api.facilities({ limit: 20 }),
    ]);
    setPending(repRes.data.reports || []);
    setFacilities(facRes.data.facilities || []);
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    await api.verifyReport(id);
    setMsg('Report verified');
    load();
  };

  const updateFacility = async () => {
    if (!selected) return;
    await api.updateFacility(selected.id, form);
    setMsg('Facility updated');
    load();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
      <h3 className="text-sm font-bold text-emerald-800">Health Worker Panel</h3>

      {msg && <p className="text-xs text-emerald-600">{msg}</p>}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Pending Reports to Verify</p>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">No pending reports</p>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium">{r.facility?.name}</p>
                  <p className="text-xs text-gray-400">by {r.reporter?.firstName} {r.reporter?.lastName}</p>
                </div>
                <button type="button" onClick={() => verify(r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                  Verify
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">Update Facility Status</p>
        <select
          value={selected?.id || ''}
          onChange={(e) => {
            const f = facilities.find((x) => x.id === e.target.value);
            setSelected(f);
            if (f) setForm({ isOpen: f.isOpen, waitTimeMinutes: f.waitTimeMinutes, crowdLevel: f.crowdLevel });
          }}
          className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Select facility...</option>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {selected && (
          <div className="grid grid-cols-3 gap-2">
            <label className="text-xs">
              Open
              <select value={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.value === 'true' })} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <label className="text-xs">
              Wait (min)
              <input type="number" value={form.waitTimeMinutes} onChange={(e) => setForm({ ...form, waitTimeMinutes: +e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              Crowd
              <select value={form.crowdLevel} onChange={(e) => setForm({ ...form, crowdLevel: e.target.value })} className="mt-1 w-full rounded-lg border px-2 py-1.5 text-sm">
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
        )}
        {selected && (
          <button type="button" onClick={updateFacility} className="mt-2 rounded-lg bg-brand-orange px-4 py-2 text-xs font-medium text-white hover:opacity-90">
            Save Official Update
          </button>
        )}
      </div>
    </div>
  );
}
