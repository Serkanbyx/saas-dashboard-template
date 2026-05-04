import Notification from '../models/Notification.js';

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 50);

  return { page, limit };
};

const getNotificationFilter = (req) => {
  const filter = { userId: req.user._id };

  if (req.query.orgId) {
    filter.orgId = req.query.orgId;
  }

  if (req.query.unread === 'true') {
    filter.read = false;
  }

  return filter;
};

const getOwnedNotification = async (req) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!notification) {
    throw createHttpError(404, 'Notification not found');
  }

  return notification;
};

export const listMyNotifications = async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query);
    const filter = getNotificationFilter(req);

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id, read: false };

    if (req.query.orgId) {
      filter.orgId = req.query.orgId;
    }

    const count = await Notification.countDocuments(filter);

    return res.json({ success: true, data: { count } });
  } catch (error) {
    return next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await getOwnedNotification(req);

    if (!notification.read) {
      notification.read = true;
      await notification.save();
    }

    return res.json({ success: true, data: { notification } });
  } catch (error) {
    return next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id, read: false };

    if (req.query.orgId) {
      filter.orgId = req.query.orgId;
    }

    const result = await Notification.updateMany(filter, { read: true });

    return res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notification = await getOwnedNotification(req);
    await notification.deleteOne();

    return res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
