import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';

const getNotificationId = (notification) => notification?._id || notification?.id;

const formatNotificationTime = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications = [], unreadCount = 0, markAllRead, markRead } = useNotification() || {};
  const [isOpen, setIsOpen] = useState(false);
  const recentNotifications = notifications.slice(0, 10);

  const handleNotificationClick = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (notificationId && !notification.read) {
      await markRead?.(notificationId);
    }

    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead?.();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-cyan-300 dark:focus:ring-offset-slate-950"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          role="menu"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Notifications</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-cyan-300 dark:hover:bg-slate-800"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification) => (
                <button
                  key={getNotificationId(notification)}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                  role="menuitem"
                >
                  <span
                    className={`mt-1 h-2 w-2 flex-none rounded-full ${
                      notification.read ? 'bg-gray-300 dark:bg-slate-700' : 'bg-brand-600'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900 dark:text-slate-100">
                      {notification.title || 'Notification'}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm text-gray-600 dark:text-slate-300">
                      {notification.message || 'You have a new update.'}
                    </span>
                    <span className="mt-1 block text-xs text-gray-400 dark:text-slate-500">
                      {formatNotificationTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">No notifications yet.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate('/app/notifications');
            }}
            className="w-full border-t border-gray-100 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus:bg-brand-50 focus:outline-none dark:border-slate-800 dark:text-cyan-300 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
            role="menuitem"
          >
            View all
          </button>
        </div>
      ) : null}
    </div>
  );
};
