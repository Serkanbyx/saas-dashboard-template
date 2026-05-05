import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/common';
import { formatNotificationTime, getNotificationConfig, getSafeNotificationPath } from '../../components/layout/NotificationBell';
import { useNotification } from '../../hooks/useNotification';

const getNotificationId = (notification) => notification?._id || notification?.id;

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications = [], unreadCount = 0, markAllRead, markRead } = useNotification() || {};

  const handleNotificationClick = async (notification) => {
    const notificationId = getNotificationId(notification);

    if (notificationId && !notification.read) {
      await markRead?.(notificationId);
    }

    const safePath = getSafeNotificationPath(notification.link);

    if (safePath) {
      navigate(safePath);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Workspace</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Notifications</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
              Review recent workspace updates, member changes, invitations, and billing events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => markAllRead?.()}
            disabled={unreadCount === 0}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Mark all as read
          </button>
        </div>
      </section>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" message="Important workspace updates will appear here." />
      ) : (
        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ul className="divide-y divide-gray-100 dark:divide-slate-800" aria-label="Notifications">
            {notifications.map((notification, index) => {
              const notificationId = getNotificationId(notification);
              const { icon: Icon, className } = getNotificationConfig(notification.type);

              return (
                <li key={notificationId || `${notification.createdAt}-${index}`}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="flex w-full gap-4 px-5 py-4 text-left transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                  >
                    <span className={`mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-full ${className}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-950 dark:text-slate-50">
                          {notification.title || 'Notification'}
                        </span>
                        {!notification.read ? (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200">
                            Unread
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-gray-600 dark:text-slate-300">
                        {notification.message || 'You have a new update.'}
                      </span>
                      <span className="mt-1 block text-xs text-gray-400 dark:text-slate-500">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};
