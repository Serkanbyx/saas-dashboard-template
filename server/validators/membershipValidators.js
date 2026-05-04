import { body, param, query } from 'express-validator';
import { ORG_ROLES } from '../utils/constants.js';

export const membershipIdParamRule = [
  param('membershipId').isMongoId().withMessage('Invalid membership identifier'),
];

export const listMembersRules = [
  query('search')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search cannot exceed 100 characters')
    .escape(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

export const updateMemberRoleRules = [
  ...membershipIdParamRule,
  body('role').isIn(ORG_ROLES).withMessage('Invalid role'),
];

export const transferOwnershipRules = [
  ...membershipIdParamRule,
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required'),
];
