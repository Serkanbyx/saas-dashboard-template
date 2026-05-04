import { logger } from '../config/logger.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import { emitToUser } from './socketService.js';

const normalizeId = (id) => id?.toString();

const isExcludedUser = (userId, excludedUserIds) => {
  const normalizedUserId = normalizeId(userId);
  return excludedUserIds.some((excludedUserId) => normalizeId(excludedUserId) === normalizedUserId);
};

export const createNotification = async ({
  userId,
  orgId,
  type,
  title,
  message,
  link,
  metadata = {},
}) => {
  const notification = await Notification.create({ userId, orgId, type, title, message, link, metadata });
  emitToUser(userId, 'notification:new', notification);

  return notification;
};

export const createNotificationSafely = async (payload) => {
  try {
    return await createNotification(payload);
  } catch (error) {
    logger.error(
      {
        err: error,
        userId: payload.userId,
        orgId: payload.orgId,
        type: payload.type,
      },
      'Notification creation failed',
    );
    return null;
  }
};

export const createOrgNotifications = async ({ orgId, excludeUserIds = [], ...notificationPayload }) => {
  try {
    const memberships = await Membership.find({ orgId }).select('userId');
    const targetUserIds = memberships
      .map((membership) => membership.userId)
      .filter((userId) => !isExcludedUser(userId, excludeUserIds));

    if (targetUserIds.length === 0) {
      return [];
    }

    const notifications = await Notification.insertMany(
      targetUserIds.map((userId) => ({
        ...notificationPayload,
        userId,
        orgId,
      })),
    );

    notifications.forEach((notification) => {
      emitToUser(notification.userId, 'notification:new', notification);
    });

    return notifications;
  } catch (error) {
    logger.error({ err: error, orgId, type: notificationPayload.type }, 'Organization notification creation failed');
    return [];
  }
};
