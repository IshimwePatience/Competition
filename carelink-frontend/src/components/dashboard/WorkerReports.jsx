import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function WorkerReports() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const repRes = await api.reports({ status: 'pending', limit: 20 });
      setPending(repRes.data.reports || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    await api.verifyReport(id);
    setMsg('Report verified');
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-emerald-800">Pending Reports</h2>
          <p className="text-sm text-gray-500">Community reports waiting for verification</p>
        </div>
        <span className="text-sm text-gray-400">{pending.length} items total</span>
      </div>

      {msg && <p className="mb-2 text-xs text-emerald-600">{msg}</p>}

      {pending.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 p-12 text-center text-sm text-gray-400">
          No pending reports to verify
        </div>
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
  );
}
