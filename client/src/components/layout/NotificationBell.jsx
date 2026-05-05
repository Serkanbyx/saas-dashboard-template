import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CreditCard,
  Info,
  Mail,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';

const getNotificationId = (notification) => notification?._id || notification?.id;

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const notificationTypeConfig = {
  invite_accepted: {
    icon: UserCheck,
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  invite_received: {
    icon: Mail,
    className: 'bg-brand-50 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300',
  },
  member_joined: {
    icon: UserPlus,
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  member_removed: {
    icon: UserMinus,
    className: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
  },
  mention: {
    icon: Info,
    className: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300',
  },
  org_suspended: {
    icon: ShieldAlert,
    className: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300',
  },
  plan_changed: {
    icon: CreditCard,
    className: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
  },
  role_changed: {
    icon: AlertTriangle,
    className: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300',
  },
};

const fallbackNotificationConfig = {
  icon: Bell,
  className: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300',
};

const clientRouteRewrites = {
  '/billing': '/app/billing',
  '/dashboard': '/app/dashboard',
  '/invitations': '/app/members?tab=pending',
  '/members': '/app/members',
  '/organizations': '/create-org',
  '/settings': '/app/settings',
};

const allowedClientPathPrefixes = ['/app', '/create-org', '/invite/accept', '/invitations/accept', '/login', '/register', '/super-admin'];

export const formatNotificationTime = (value) => {
  if (!value) {
    return '';
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return '';
  }

  const diffInSeconds = Math.round((timestamp - Date.now()) / 1000);
  const thresholds = [
    { limit: 60, unit: 'second', divisor: 1 },
    { limit: 60 * 60, unit: 'minute', divisor: 60 },
    { limit: 60 * 60 * 24, unit: 'hour', divisor: 60 * 60 },
    { limit: 60 * 60 * 24 * 7, unit: 'day', divisor: 60 * 60 * 24 },
    { limit: 60 * 60 * 24 * 30, unit: 'week', divisor: 60 * 60 * 24 * 7 },
    { limit: 60 * 60 * 24 * 365, unit: 'month', divisor: 60 * 60 * 24 * 30 },
  ];
  const absoluteDiff = Math.abs(diffInSeconds);
  const threshold = thresholds.find((item) => absoluteDiff < item.limit);

  if (threshold) {
    return relativeTimeFormatter.format(Math.round(diffInSeconds / threshold.divisor), threshold.unit);
  }

  return relativeTimeFormatter.format(Math.round(diffInSeconds / (60 * 60 * 24 * 365)), 'year');
};

export const getNotificationConfig = (type) => notificationTypeConfig[type] || fallbackNotificationConfig;

export const getSafeNotificationPath = (link) => {
  if (typeof link !== 'string' || !link.startsWith('/') || link.startsWith('//')) {
    return null;
  }

  const targetUrl = new URL(link, window.location.origin);

  if (targetUrl.origin !== window.location.origin) {
    return null;
  }

  const routePath = clientRouteRewrites[targetUrl.pathname] || targetUrl.pathname;
  const routeSearch = clientRouteRewrites[targetUrl.pathname]?.includes('?') ? '' : targetUrl.search;
  const isAllowedClientRoute = allowedClientPathPrefixes.some(
    (prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`),
  );

  return isAllowedClientRoute ? `${routePath}${routeSearch}${targetUrl.hash}` : null;
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

    const safePath = getSafeNotificationPath(notification.link);

    if (safePath) {
      navigate(safePath);
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
          </div>

          <div className="max-h-96 overflow-y-auto py-2">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notification, index) => {
                const { icon: Icon, className } = getNotificationConfig(notification.type);
                const notificationId = getNotificationId(notification);

                return (
                  <button
                    key={notificationId || `${notification.createdAt}-${index}`}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                    role="menuitem"
                  >
                    <span className={`mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full ${className}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
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
                    {!notification.read ? (
                      <span className="mt-2 h-2 w-2 flex-none rounded-full bg-brand-600" aria-label="Unread notification" />
                    ) : null}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">No notifications yet.</p>
            )}
          </div>

          <div className="grid grid-cols-2 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus:bg-brand-50 focus:outline-none disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent dark:text-cyan-300 dark:hover:bg-slate-800 dark:disabled:text-slate-600"
              role="menuitem"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              Mark all as read
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/app/notifications');
              }}
              className="border-l border-gray-100 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus:bg-brand-50 focus:outline-none dark:border-slate-800 dark:text-cyan-300 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
              role="menuitem"
            >
              View all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
