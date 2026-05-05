import { query } from 'express-validator';
import { ACTIVITY_ACTIONS, ACTIVITY_TARGET_TYPES } from '../models/ActivityLog.js';

const getQueryList = (value) => {
  const values = Array.isArray(value) ? value : value.split(',');
  return values.map((item) => item.trim()).filter(Boolean);
};

export const listActivityRules = [
  query('action')
    .optional({ values: 'falsy' })
    .custom((value) => getQueryList(value).every((action) => ACTIVITY_ACTIONS.includes(action)))
    .withMessage('Invalid activity action'),
  query('actorId').optional().isMongoId().withMessage('Invalid actor identifier'),
  query('targetType').optional().isIn(ACTIVITY_TARGET_TYPES).withMessage('Invalid activity target type'),
  query('startDate').optional({ values: 'falsy' }).isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional({ values: 'falsy' }).isISO8601().withMessage('End date must be a valid ISO date'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];
