import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import FacilityCard from './FacilityCard';
import EmptyState from '../ui/EmptyState';

export default function UserFacilities({ onReport }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    api.facilitiesNearby({ latitude: -1.2921, longitude: 36.8219, radiusKm: 15 })
      .then((res) => setFacilities(res.data || res))
      .catch(() => setFacilities([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = facilities.filter((f) => {
    if (filter === 'open' && !f.isOpen) return false;
    if (typeFilter !== 'all' && f.type !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-gray-100 bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nearby Facilities</h2>
          <p className="text-sm text-gray-500">Clinics and pharmacies within 15 km — tap to report live status</p>
        </div>
        <span className="text-sm text-gray-400">{filtered.length} items total</span>
      </div>

      <div className="mb-4 flex gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          <option value="all">Featured</option>
          <option value="open">Open Now</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          <option value="all">All Types</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="clinic">Clinic</option>
          <option value="hospital">Hospital</option>
          <option value="emergency">Emergency</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No facilities nearby yet" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((f) => (
            <FacilityCard key={f.id} facility={f} onClick={onReport} actionLabel="Report status" />
          ))}
        </div>
      )}
    </div>
  );
}
