import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import {
  DataTable,
  TableActionButton,
  TableCell,
  TableEmpty,
  TableLoading,
  TablePanel,
  TablePrimaryCell,
  TableRow,
} from '../ui/DataTable';

export default function WorkerReports() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const repRes = await api.reports({ status: 'pending', limit: 50 });
      setPending(repRes.data.reports || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pending;
    return pending.filter((r) =>
      r.facility?.name?.toLowerCase().includes(q) ||
      `${r.reporter?.firstName} ${r.reporter?.lastName}`.toLowerCase().includes(q)
    );
  }, [pending, search]);

  const verify = async (id) => {
    await api.verifyReport(id);
    setMsg('Report verified');
    load();
  };

  return (
    <TablePanel
      title="Pending Reports"
      subtitle="Community reports waiting for verification"
      count={filtered.length}
    >
      {msg && <p className="mb-3 text-[12px] text-gray-500">{msg}</p>}

      <div className="mb-4 flex min-w-[240px] max-w-md">
        <input
          type="text"
          placeholder="Search reports"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-200 px-4 text-[14px] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {loading ? (
        <TableLoading />
      ) : filtered.length === 0 ? (
        <TableEmpty message="No pending reports to verify" />
      ) : (
        <DataTable
          columns={[
            { key: 'facility', label: 'Facility', sortable: true },
            { key: 'reporter', label: 'Reporter' },
            { key: 'details', label: 'Details' },
            { key: 'action', label: 'Action' },
          ]}
        >
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TablePrimaryCell
                title={r.facility?.name}
                subtitle={`${r.isOpen ? 'Open' : 'Closed'} · ${r.waitTimeMinutes}min · ${r.crowdLevel} crowd`}
              />
              <TableCell>
                {r.reporter?.firstName} {r.reporter?.lastName}
              </TableCell>
              <TableCell className="text-[13px] text-gray-400">
                {r.notes || '—'}
              </TableCell>
              <TableCell>
                <TableActionButton variant="primary" onClick={() => verify(r.id)}>
                  Verify
                </TableActionButton>
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </TablePanel>
  );
}
