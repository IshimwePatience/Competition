import SearchBar from '../SearchBar';
import NotificationBell from '../NotificationBell';

export default function Topbar({ activeView, onViewChange, showSearch = true }) {
  const tabs = [
    { id: 'nearby', label: 'Nearby Facilities' },
    { id: 'activity', label: 'My Activity' },
  ];

  return (
    <header className="border-b border-gray-100 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onViewChange(tab.id)}
              className={`relative pb-1 text-sm font-semibold transition ${
                activeView === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {activeView === tab.id && (
                <span className="absolute -bottom-4 left-0 right-0 h-0.5 rounded-full bg-brand-orange" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {showSearch && <SearchBar />}
          <button type="button" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </button>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
