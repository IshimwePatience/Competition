import SearchBar from '../SearchBar';
import NotificationBell from '../NotificationBell';

export default function Topbar({ pageTitle, pageSubtitle, showSearch = true, itemCount }) {
  return (
    <header className="shrink-0 border-b border-gray-100 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400">
            Dashboard / {pageSubtitle}
          </p>
          <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
        </div>

        <div className="flex items-center gap-3">
          {itemCount != null && (
            <span className="hidden text-sm text-gray-400 sm:inline">{itemCount} items total</span>
          )}
          {showSearch && <SearchBar />}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
