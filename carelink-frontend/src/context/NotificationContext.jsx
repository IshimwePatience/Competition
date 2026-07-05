import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import { getToken } from '../api/token';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await api.notifications({ limit: 20 });
    setNotifications(res.data.notifications);
    setUnreadCount(res.data.notifications.filter((n) => !n.isRead).length);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      socket?.disconnect();
      setSocket(null);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadNotifications();

    const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token: getToken() || undefined },
    });

    s.on('connect', () => {});

    const handleNotification = (data) => {
      setNotifications((prev) => [{ ...data, isRead: false, createdAt: new Date().toISOString() }, ...prev]);
      setUnreadCount((c) => c + 1);
      addToast({ title: data.title, message: data.message, type: data.type });
    };

    s.on('notification:new', handleNotification);
    s.on('credit:earned', (data) => {
      addToast({ title: 'Credits Earned', message: `+${data.amount} health credits`, type: 'credit' });
    });
    s.on('report:verified', (data) => {
      addToast({ title: 'Report Verified', message: `Your report for ${data.facilityName} was verified`, type: 'report' });
    });
    s.on('facility:updated', (data) => {
      addToast({ title: 'Facility Updated', message: `${data.name} status changed`, type: 'facility' });
    });
    s.on('worker:approved', () => {
      addToast({ title: 'Account Verified', message: 'Your health worker account is now verified', type: 'system' });
    });
    s.on('report:pending', (data) => {
      addToast({ title: 'New Report', message: `Pending report for ${data.facilityName}`, type: 'report' });
    });

    setSocket(s);
    return () => s.disconnect();
  }, [isAuthenticated, loadNotifications, addToast]);

  const markRead = async (id) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const value = useMemo(
    () => ({ notifications, toasts, unreadCount, loadNotifications, markRead, addToast }),
    [notifications, toasts, unreadCount, loadNotifications, markRead, addToast]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
