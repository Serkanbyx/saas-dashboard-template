import { body, param, query } from 'express-validator';
import { PLANS } from '../utils/constants.js';
import { validate } from './authValidators.js';

const platformRoles = ['user', 'superadmin'];
const booleanMessage = 'Value must be true or false';

export const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

export const orgIdParamRule = [param('orgId').isMongoId().withMessage('Invalid organization identifier')];

export const userIdParamRule = [param('userId').isMongoId().withMessage('Invalid user identifier')];

export const listAllOrgsRules = [
  ...paginationRules,
  query('plan').optional().isIn(Object.keys(PLANS)).withMessage('Invalid plan'),
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Search cannot exceed 120 characters'),
  query('isDeleted').optional().isBoolean().withMessage(booleanMessage).toBoolean(),
];

export const listAllUsersRules = [
  ...paginationRules,
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Search cannot exceed 120 characters'),
  query('platformRole').optional().isIn(platformRoles).withMessage('Invalid platform role'),
  query('isActive').optional().isBoolean().withMessage(booleanMessage).toBoolean(),
];

export const suspendOrgRules = [
  ...orgIdParamRule,
  body('reason')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Suspension reason must be between 3 and 500 characters'),
];

export const forceDeleteOrgRules = [
  ...orgIdParamRule,
  body('confirmName').trim().notEmpty().withMessage('Organization name confirmation is required'),
];

export const updateUserStatusRules = [
  ...userIdParamRule,
  body('isActive').optional().isBoolean().withMessage(booleanMessage).toBoolean(),
  body('platformRole').optional().isIn(platformRoles).withMessage('Invalid platform role'),
];

export { validate };
