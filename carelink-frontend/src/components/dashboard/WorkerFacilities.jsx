import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function WorkerFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ isOpen: true, waitTimeMinutes: 15, crowdLevel: 'moderate' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const facRes = await api.facilities({ limit: 50 });
      setFacilities(facRes.data?.facilities || facRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateFacility = async () => {
    if (!selected) return;
    await api.updateFacility(selected.id, form);
    setMsg('Facility updated');
    load();
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-emerald-800">Update Facility Status</h2>
      <p className="mt-1 text-sm text-gray-500">Official updates from verified health workers</p>
      {msg && <p className="mt-2 text-xs text-emerald-600">{msg}</p>}

      <div className="mt-4">
        <select
          value={selected?.id || ''}
          onChange={(e) => {
            const f = facilities.find((x) => x.id === e.target.value);
            setSelected(f);
            if (f) setForm({ isOpen: f.isOpen, waitTimeMinutes: f.waitTimeMinutes, crowdLevel: f.crowdLevel });
          }}
          className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Select facility...</option>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        {selected && (
          <>
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
            <button type="button" onClick={updateFacility} className="mt-3 rounded-lg bg-brand-orange px-4 py-2 text-xs font-medium text-white hover:opacity-90">
              Save Official Update
            </button>
          </>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">All Facilities ({facilities.length})</p>
        <div className="space-y-2">
          {facilities.map((f) => (
            <div key={f.id} className="rounded-xl bg-white px-4 py-3 text-sm">
              <p className="font-medium">{f.name}</p>
              <p className="text-xs capitalize text-gray-400">{f.type} — {f.isOpen ? 'Open' : 'Closed'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
