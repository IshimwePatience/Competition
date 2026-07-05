import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import {
  DataTable,
  StatusBadge,
  TableCell,
  TableEmpty,
  TableLoading,
  TablePanel,
  TablePrimaryCell,
  TableRow,
} from '../ui/DataTable';

export default function WorkerFacilities() {
  const [facilities, setFacilities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ isOpen: true, waitTimeMinutes: 15, crowdLevel: 'moderate' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const facRes = await api.facilities({ limit: 50 });
      setFacilities(facRes.data?.facilities || facRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return facilities;
    return facilities.filter((f) =>
      f.name?.toLowerCase().includes(q) ||
      f.type?.toLowerCase().includes(q)
    );
  }, [facilities, search]);

  const updateFacility = async () => {
    if (!selected) return;
    await api.updateFacility(selected.id, form);
    setMsg('Facility updated');
    load();
  };

  return (
    <div className="space-y-4">
      <TablePanel title="Update Facility Status" subtitle="Official updates from verified health workers">
        {msg && <p className="mb-3 text-[12px] text-gray-500">{msg}</p>}

        <select
          value={selected?.id || ''}
          onChange={(e) => {
            const f = facilities.find((x) => x.id === e.target.value);
            setSelected(f);
            if (f) setForm({ isOpen: f.isOpen, waitTimeMinutes: f.waitTimeMinutes, crowdLevel: f.crowdLevel });
          }}
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-[14px] text-gray-700"
        >
          <option value="">Select facility...</option>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        {selected && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[12px] text-gray-500">
                Open
                <select value={form.isOpen} onChange={(e) => setForm({ ...form, isOpen: e.target.value === 'true' })} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[14px]">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
              <label className="text-[12px] text-gray-500">
                Wait (min)
                <input type="number" value={form.waitTimeMinutes} onChange={(e) => setForm({ ...form, waitTimeMinutes: +e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[14px]" />
              </label>
              <label className="text-[12px] text-gray-500">
                Crowd
                <select value={form.crowdLevel} onChange={(e) => setForm({ ...form, crowdLevel: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-[14px]">
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <button type="button" onClick={updateFacility} className="mt-3 rounded-lg bg-brand-orange px-4 py-2 text-[12px] font-medium text-white hover:opacity-90">
              Save Official Update
            </button>
          </>
        )}
      </TablePanel>

      <TablePanel title="All Facilities" subtitle="Browse and select facilities to update" count={filtered.length}>
        <div className="mb-4 flex min-w-[240px] max-w-md">
          <input
            type="text"
            placeholder="Search facilities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 px-4 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
        </div>

        {loading ? (
          <TableLoading />
        ) : filtered.length === 0 ? (
          <TableEmpty message="No facilities found" />
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status' },
              { key: 'wait', label: 'Wait Time' },
            ]}
          >
            {filtered.map((f) => (
              <TableRow key={f.id} onClick={() => {
                setSelected(f);
                setForm({ isOpen: f.isOpen, waitTimeMinutes: f.waitTimeMinutes ?? 15, crowdLevel: f.crowdLevel || 'moderate' });
              }}>
                <TablePrimaryCell
                  title={f.name}
                  subtitle={f.address || '—'}
                />
                <TableCell className="capitalize">{f.type}</TableCell>
                <TableCell>
                  <StatusBadge status={f.isOpen ? 'open' : 'closed'} label={f.isOpen ? 'Open' : 'Closed'} />
                </TableCell>
                <TableCell>{f.waitTimeMinutes != null ? `${f.waitTimeMinutes} min` : '—'}</TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </TablePanel>
    </div>
  );
}
