import { body, param } from 'express-validator';
import { ORG_ROLES } from '../utils/constants.js';

export const membershipIdParamRule = [
  param('membershipId').isMongoId().withMessage('Invalid membership identifier'),
];

export const updateMemberRoleRules = [
  ...membershipIdParamRule,
  body('role').isIn(ORG_ROLES).withMessage('Invalid role'),
];

export const transferOwnershipRules = [
  ...membershipIdParamRule,
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required'),
];
