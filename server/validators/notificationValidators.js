import { param, query } from 'express-validator';

export const notificationIdParamRule = [
  param('id').isMongoId().withMessage('Invalid notification identifier'),
];

export const listNotificationRules = [
  query('orgId').optional().isMongoId().withMessage('Invalid organization identifier'),
  query('unread').optional().isBoolean().withMessage('Unread must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

export const unreadCountRules = [
  query('orgId').optional().isMongoId().withMessage('Invalid organization identifier'),
];

export const markAllAsReadRules = [
  query('orgId').optional().isMongoId().withMessage('Invalid organization identifier'),
];
