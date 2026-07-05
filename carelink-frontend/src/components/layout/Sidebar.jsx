import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { id: 'triage', label: 'AI Triage', icon: 'M12 4v16m8-8H4' },
  { id: 'facilities', label: 'My Facilities', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { id: 'reports', label: 'My Reports', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-100 bg-brand-sidebar px-4 py-5">
      <div className="mb-8 px-2">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              activeTab === item.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white/60'
            }`}
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}

        <div className="pt-4">
          <p className="px-3 text-xs font-medium text-gray-400">Recent</p>
        </div>
      </nav>

      <div className="mt-auto rounded-xl bg-white p-3 shadow-sm">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-peach text-sm font-bold text-white">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="truncate text-xs capitalize text-gray-400">{user.role?.replace('_', ' ')}</p>
            </div>
            <button type="button" onClick={logout} className="text-gray-400 hover:text-gray-600" title="Logout">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Log in</p>
        )}
      </div>
    </aside>
  );
}
