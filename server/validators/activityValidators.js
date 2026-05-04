import { query } from 'express-validator';
import { ACTIVITY_ACTIONS, ACTIVITY_TARGET_TYPES } from '../models/ActivityLog.js';

export const listActivityRules = [
  query('action').optional().isIn(ACTIVITY_ACTIONS).withMessage('Invalid activity action'),
  query('actorId').optional().isMongoId().withMessage('Invalid actor identifier'),
  query('targetType').optional().isIn(ACTIVITY_TARGET_TYPES).withMessage('Invalid activity target type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];
