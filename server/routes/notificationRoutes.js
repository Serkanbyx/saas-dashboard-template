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

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List notifications for the current user
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: unread
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: Notification list
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, listNotificationRules, validate, listMyNotifications);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     summary: Get the current user's unread notification count
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: orgId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/unread-count', protect, unreadCountRules, validate, getUnreadCount);

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all current user notifications as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: orgId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.patch('/read-all', protect, markAllAsReadRules, validate, markAllAsRead);

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', protect, notificationIdParamRule, validate, markAsRead);

/**
 * @openapi
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', protect, notificationIdParamRule, validate, deleteNotification);

export default router;
