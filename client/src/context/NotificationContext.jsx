import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { useSocket } from '../hooks/useSocket';
import * as notificationService from '../services/notificationService';

const MAX_NOTIFICATIONS = 50;

export const NotificationContext = createContext(null);

const getNotificationId = (notification) => notification?._id || notification?.id;
const getOrgId = (org) => org?._id || org?.id;

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { activeOrg } = useOrg();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const activeOrgId = getOrgId(activeOrg);

  const addNotification = useCallback((notification) => {
    if (!notification) {
      return;
    }

    setNotifications((currentNotifications) => {
      const notificationId = getNotificationId(notification);
      const filteredNotifications = notificationId
        ? currentNotifications.filter((item) => getNotificationId(item) !== notificationId)
        : currentNotifications;

      return [notification, ...filteredNotifications].slice(0, MAX_NOTIFICATIONS);
    });

    if (!notification.read) {
      setUnreadCount((currentCount) => currentCount + 1);
    }

    toast(notification.title || notification.message || 'New notification');
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

        setNotifications(notificationsResponse.data?.data?.notifications || []);
        setUnreadCount(unreadCountResponse.data?.data?.count || 0);
      } catch (_error) {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
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
