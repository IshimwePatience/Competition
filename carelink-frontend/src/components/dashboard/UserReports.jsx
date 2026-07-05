import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import {
  DataTable,
  TableCell,
  TableEmpty,
  TableLoading,
  TablePanel,
  TablePrimaryCell,
  TableRow,
  StatusBadge,
} from '../ui/DataTable';

export default function UserReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.reports({ limit: 50 })
      .then((res) => setReports(res.data.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) =>
      r.facility?.name?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  }, [reports, search]);

  return (
    <TablePanel
      title="My Reports"
      subtitle="Community status updates you submitted for facilities"
      count={filtered.length}
    >
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
        <TableEmpty message="No reports yet. Go to My Facilities and report a clinic or pharmacy status." />
      ) : (
        <DataTable
          columns={[
            { key: 'facility', label: 'Facility', sortable: true },
            { key: 'date', label: 'Date' },
            { key: 'status', label: 'Status' },
          ]}
        >
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TablePrimaryCell
                title={r.facility?.name || 'Unknown facility'}
                subtitle={r.notes || 'Community status report'}
              />
              <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </TablePanel>
  );
}
