import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { useSocket } from '../hooks/useSocket';
import * as notificationService from '../services/notificationService';

const MAX_NOTIFICATIONS = 50;

export const NotificationContext = createContext(null);

const getNotificationId = (notification) => notification?._id || notification?.id;
const getOrgId = (org) => org?._id || org?.id;

const getToastAvatar = (notification) =>
  notification?.metadata?.actorAvatar ||
  notification?.metadata?.avatar ||
  notification?.metadata?.userAvatar ||
  notification?.metadata?.orgLogo ||
  null;

const getToastInitials = (notification) => {
  const fallbackText = notification?.metadata?.actorName || notification?.title || notification?.message || 'Notification';

  return fallbackText
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const NotificationToast = ({ notification }) => {
  const avatar = getToastAvatar(notification);

  return (
    <div className="flex max-w-sm items-start gap-3">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="h-9 w-9 flex-none rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200">
          {getToastInitials(notification)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-950 dark:text-slate-50">
          {notification?.title || 'New notification'}
        </span>
        <span className="mt-1 block text-sm text-gray-600 dark:text-slate-300">
          {notification?.message || 'You have a new update.'}
        </span>
      </span>
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { activeOrg } = useOrg();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotificationIdsRef = useRef(new Set());
  const activeOrgId = getOrgId(activeOrg);

  const addNotification = useCallback((notification) => {
    if (!notification) {
      return;
    }

    const notificationId = getNotificationId(notification);
    const wasAlreadySeen = notificationId ? seenNotificationIdsRef.current.has(notificationId) : false;

    if (notificationId) {
      seenNotificationIdsRef.current.add(notificationId);
    }

    setNotifications((currentNotifications) => {
      const filteredNotifications = notificationId
        ? currentNotifications.filter((item) => getNotificationId(item) !== notificationId)
        : currentNotifications;

      return [notification, ...filteredNotifications].slice(0, MAX_NOTIFICATIONS);
    });

    if (!notification.read && !wasAlreadySeen) {
      setUnreadCount((currentCount) => currentCount + 1);
    }

    if (!wasAlreadySeen) {
      toast.success(<NotificationToast notification={notification} />);
    }
  }, []);

  const markRead = useCallback(
    async (notificationId) => {
      const targetNotification = notifications.find((notification) => getNotificationId(notification) === notificationId);
      const response = await notificationService.markAsRead(notificationId);
      const updatedNotification = response.data?.data?.notification;

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          getNotificationId(notification) === notificationId
            ? { ...notification, ...(updatedNotification || {}), read: true }
            : notification,
        ),
      );

      if (targetNotification && !targetNotification.read) {
        setUnreadCount((currentCount) => Math.max(currentCount - 1, 0));
      }

      return updatedNotification;
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    await notificationService.markAllAsRead(activeOrgId ? { orgId: activeOrgId } : undefined);

    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, read: true })),
    );
    setUnreadCount(0);
  }, [activeOrgId]);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      if (!token || !user) {
        setNotifications([]);
        setUnreadCount(0);
        seenNotificationIdsRef.current = new Set();
        return;
      }

      const params = {
        limit: 20,
        ...(activeOrgId ? { orgId: activeOrgId } : {}),
      };

      try {
        const [notificationsResponse, unreadCountResponse] = await Promise.all([
          notificationService.listMyNotifications(params),
          notificationService.getUnreadCount(activeOrgId ? { orgId: activeOrgId } : undefined),
        ]);

        if (!isMounted) {
          return;
        }

        const loadedNotifications = notificationsResponse.data?.data?.notifications || [];

        seenNotificationIdsRef.current = new Set(loadedNotifications.map(getNotificationId).filter(Boolean));
        setNotifications(loadedNotifications);
        setUnreadCount(unreadCountResponse.data?.data?.count || 0);
      } catch (_error) {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
          seenNotificationIdsRef.current = new Set();
        }
      }
    };

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [activeOrgId, token, user]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleNotification = (notification) => {
      addNotification(notification);
    };

    const handleActivity = (activity) => {
      if (activity?.notification) {
        addNotification(activity.notification);
      }
    };

    socket.on('notification:new', handleNotification);
    socket.on('activity:new', handleActivity);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('activity:new', handleActivity);
    };
  }, [addNotification, socket]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markRead,
      markAllRead,
    }),
    [addNotification, markAllRead, markRead, notifications, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
