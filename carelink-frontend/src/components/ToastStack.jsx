import { useNotifications } from '../context/NotificationContext';

export default function ToastStack() {
  const { toasts } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="animate-slide-in rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{t.title}</p>
          <p className="text-xs text-gray-500">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
