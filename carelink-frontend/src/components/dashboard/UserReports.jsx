import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function UserReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.reports({ limit: 20 })
      .then((res) => setReports(res.data.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-100 bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My Reports</h2>
          <p className="text-sm text-gray-500">Community status updates you submitted for facilities</p>
        </div>
        <span className="text-sm text-gray-400">{reports.length} items total</span>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-400">
          No reports yet. Go to My Facilities and report a clinic or pharmacy status.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{r.facility?.name}</p>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                r.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                r.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
