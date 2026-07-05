import { useEffect, useRef, useState } from 'react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';

const baseNavItems = [
  { id: 'facilities', label: 'My Facilities', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { id: 'reports', label: 'My Reports', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const adminNavItems = [
  {
    id: 'admin-ai',
    label: 'Admin AI',
    icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
  },
  {
    id: 'users',
    label: 'Platform Users',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
];

const facilityNavItems = [
  {
    id: 'facility-profile',
    label: 'Facility Profile',
    icon: 'M2.25 21h19.5m-19.5 0V9.75m19.5 0V9.75M3.75 9.75h16.5M5.25 9.75V6.75a2.25 2.25 0 012.25-2.25h9a2.25 2.25 0 012.25 2.25v3M9 21v-4.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75V21',
  },
  {
    id: 'facility-stock',
    label: 'Medicine Stock',
    icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  },
];

function UserAvatarMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!user) {
    return <p className="px-2 text-sm text-gray-500">Log in</p>;
  }

  return (
    <div className="relative px-2" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600 transition hover:bg-gray-300"
        aria-label="Account menu"
      >
        {user.firstName?.[0]}{user.lastName?.[0]}
      </button>

      {open && (
        <div className="absolute bottom-full left-2 mb-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs capitalize text-gray-400">
              {user.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activeTab, onTabChange }) {
  const { user } = useAuth();
  const navItems = user?.role === 'facility'
    ? facilityNavItems
    : user?.role === 'admin'
      ? [...adminNavItems, ...baseNavItems]
      : baseNavItems;

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col border-r border-gray-100 bg-brand-sidebar px-4 py-5">
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
      </nav>

      <div className="mt-auto py-2">
        <UserAvatarMenu />
      </div>
    </aside>
  );
}
