import { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';

export interface PushNotificationData {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

// Global notification store
let pushNotifications: PushNotificationData[] = [];
let listeners: ((notifs: PushNotificationData[]) => void)[] = [];

export function usePushNotification() {
  const [notifications, setNotifications] = useState<PushNotificationData[]>(pushNotifications);

  useEffect(() => {
    const listener = (notifs: PushNotificationData[]) => {
      setNotifications([...notifs]);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const addNotification = (notification: Omit<PushNotificationData, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newNotif: PushNotificationData = {
      id,
      ...notification,
      duration: notification.duration || 5000,
    };
    pushNotifications.push(newNotif);
    listeners.forEach((l) => l(pushNotifications));

    // Auto-remove after duration
    if (newNotif.duration && newNotif.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotif.duration);
    }
  };

  const removeNotification = (id: string) => {
    pushNotifications = pushNotifications.filter((n) => n.id !== id);
    listeners.forEach((l) => l(pushNotifications));
  };

  return { notifications, addNotification, removeNotification };
}

export function PushNotificationContainer() {
  const { notifications, removeNotification } = usePushNotification();

  const getTypeClasses = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="container mx-auto px-4 py-2 flex flex-col gap-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`${getTypeClasses(
              notif.type
            )} rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-top-full duration-300 pointer-events-auto max-w-sm ml-auto mr-4 md:mr-auto md:ml-auto`}
          >
            <Bell className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{notif.title}</p>
              <p className="text-xs opacity-90">{notif.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
