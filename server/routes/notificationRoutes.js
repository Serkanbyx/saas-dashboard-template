import { Router } from 'express';
import {
  deleteNotification,
  getUnreadCount,
  listMyNotifications,
  markAllAsRead,
  markAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import {
  listNotificationRules,
  markAllAsReadRules,
  notificationIdParamRule,
  unreadCountRules,
  validate,
} from '../validators/notificationValidators.js';

const router = Router();

router.get('/', protect, listNotificationRules, validate, listMyNotifications);
router.get('/unread-count', protect, unreadCountRules, validate, getUnreadCount);
router.patch('/read-all', protect, markAllAsReadRules, validate, markAllAsRead);
router.patch('/:id/read', protect, notificationIdParamRule, validate, markAsRead);
router.delete('/:id', protect, notificationIdParamRule, validate, deleteNotification);

export default router;
