import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import EmptyState from './ui/EmptyState';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState message="No notifications yet" compact />
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.isRead && n.id && markRead(n.id)}
                  className={`w-full border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${!n.isRead ? 'bg-orange-50/50' : ''}`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
