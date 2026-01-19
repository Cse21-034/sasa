import { Bell, X, Check, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';

export function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [playedNotificationIds, setPlayedNotificationIds] = useState<Set<string>>(new Set());

  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Play sound for new unread notifications
  useEffect(() => {
    unreadNotifications.forEach(notification => {
      if (!playedNotificationIds.has(notification.id)) {
        playNotificationSound();
        setPlayedNotificationIds((prev: Set<string>) => new Set([...prev, notification.id]));
      }
    });
  }, [unreadNotifications, playedNotificationIds]);

  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set frequency and duration
    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const getNotificationLink = (notification: any) => {
    switch (notification.type) {
      case 'new_report':
        return '/admin/reports';
      case 'new_verification':
        return '/admin/verification';
      case 'new_migration':
        return '/admin/migrations';
      case 'job_posted':
      case 'application_received':
      case 'application_accepted':
      case 'application_rejected':
        return notification.jobId ? `/jobs/${notification.jobId}` : '#';
      default:
        return '#';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_posted':
        return '🆕';
      case 'application_received':
        return '📋';
      case 'application_accepted':
        return '✅';
      case 'application_rejected':
        return '❌';
      case 'message_received':
        return '💬';
      case 'new_report':
        return '🚩';
      case 'new_verification':
        return '📄';
      case 'new_migration':
        return '✈️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'job_posted':
        return 'bg-blue-50 border-blue-200';
      case 'application_received':
        return 'bg-purple-50 border-purple-200';
      case 'application_accepted':
        return 'bg-green-50 border-green-200';
      case 'application_rejected':
        return 'bg-red-50 border-red-200';
      case 'message_received':
        return 'bg-orange-50 border-orange-200';
      case 'new_report':
        return 'bg-red-50 border-red-200';
      case 'new_verification':
        return 'bg-yellow-50 border-yellow-200';
      case 'new_migration':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
      >
        <Bell className="w-4 h-4 md:w-5 md:h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="fixed md:absolute bottom-0 md:bottom-auto right-0 md:mt-2 w-full md:w-96 bg-white rounded-t-3xl md:rounded-lg shadow-2xl md:shadow-xl border-t md:border border-gray-200 z-50 max-h-[80vh] md:max-h-[500px] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-200 p-4 md:p-4 flex items-center justify-between rounded-t-3xl md:rounded-t-lg">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Notifications</h3>
              {unreadCount > 0 && <p className="text-xs md:text-sm text-gray-600">{unreadCount} unread</p>}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/50 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm md:text-base">No notifications yet</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                  >
                    <a
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                        setIsOpen(false);
                      }}
                      className={`block p-3 md:p-4 hover:bg-gray-50 transition-colors ${
                        notification.isRead ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 text-lg md:text-xl">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 text-xs md:text-sm leading-snug">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 leading-snug mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-[10px] md:text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>

              {/* Footer Actions */}
              {unreadNotifications.length > 0 && (
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 flex gap-2">
                  <Button
                    onClick={() => {
                      markAllAsRead();
                      setIsOpen(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs md:text-sm"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Mark all as read
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
