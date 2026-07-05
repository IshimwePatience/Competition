import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import FacilityCard from './FacilityCard';

export default function UserWidgets({ onTriage, onReport }) {
  const [credits, setCredits] = useState(0);
  const [facilities, setFacilities] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [credRes, facRes, repRes] = await Promise.all([
          api.creditBalance(),
          api.facilitiesNearby({ latitude: -1.2921, longitude: 36.8219, radiusKm: 15 }),
          api.reports({ limit: 5 }),
        ]);
        setCredits(credRes.data.balance);
        setFacilities(facRes.data || facRes);
        setReports(repRes.data.reports || []);
      } catch {
        /* empty state */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex h-40 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-400">Health Credits</p>
          <p className="mt-1 text-3xl font-bold text-brand-orange">{credits}</p>
          <p className="mt-1 text-xs text-gray-500">Earn more by reporting facility status</p>
        </div>
        <button
          type="button"
          onClick={onTriage}
          className="rounded-2xl border border-brand-orange/20 bg-gradient-to-br from-brand-peach/30 to-white p-5 text-left shadow-sm transition hover:shadow-md"
        >
          <p className="text-xs font-medium uppercase text-brand-orange">AI Triage</p>
          <p className="mt-1 text-lg font-bold">Describe symptoms</p>
          <p className="mt-1 text-xs text-gray-500">Get urgency level & facility recommendation</p>
        </button>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase text-gray-400">Nearby Open</p>
          <p className="mt-1 text-3xl font-bold">{facilities.filter((f) => f.isOpen).length}</p>
          <p className="mt-1 text-xs text-gray-500">Facilities within 15 km</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Nearby Facilities</h3>
        {facilities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            No facilities nearby yet. Admin can add facilities.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {facilities.slice(0, 8).map((f) => (
              <FacilityCard key={f.id} facility={f} onClick={onReport} actionLabel="Report status →" />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">My Reports</h3>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400">No reports yet</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{r.facility?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  r.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                  r.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
