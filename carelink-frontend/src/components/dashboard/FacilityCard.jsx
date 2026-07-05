const typeColors = {
  pharmacy: 'from-blue-400 to-blue-600',
  clinic: 'from-emerald-400 to-emerald-600',
  hospital: 'from-purple-400 to-purple-600',
  emergency: 'from-red-400 to-red-600',
};

export default function FacilityCard({ facility, onClick, actionLabel }) {
  const gradient = typeColors[facility.type] || 'from-gray-400 to-gray-600';

  return (
    <button
      type="button"
      onClick={() => onClick?.(facility)}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition hover:shadow-md"
    >
      <div className={`flex h-36 items-end bg-gradient-to-br ${gradient} p-4`}>
        <div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium capitalize text-white backdrop-blur">
            {facility.type}
          </span>
          <p className="mt-2 text-sm font-bold text-white line-clamp-2">{facility.name}</p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 line-clamp-1">{facility.address}</p>
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className={`font-medium ${facility.isOpen ? 'text-emerald-600' : 'text-red-500'}`}>
            {facility.isOpen ? 'Open' : 'Closed'}
          </span>
          {facility.waitTimeMinutes != null && (
            <span className="text-gray-400">~{facility.waitTimeMinutes} min wait</span>
          )}
          {facility.distanceKm != null && (
            <span className="text-gray-400">{facility.distanceKm} km</span>
          )}
        </div>
        {actionLabel && (
          <p className="mt-2 text-xs font-medium text-brand-orange opacity-0 transition group-hover:opacity-100">
            {actionLabel}
          </p>
        )}
      </div>
    </button>
  );
}
