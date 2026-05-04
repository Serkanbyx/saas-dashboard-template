import { body, param, query } from 'express-validator';
import { invitationRoles, invitationStatuses } from '../models/Invitation.js';

export const invitationIdParamRule = [
  param('invitationId').isMongoId().withMessage('Invalid invitation identifier'),
];

export const invitationTokenParamRule = [
  param('token').isUUID(4).withMessage('Invalid invitation token'),
];

export const createInvitationRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('role').optional().isIn(invitationRoles).withMessage('Invalid invitation role'),
];

export const listInvitationRules = [
  query('status').optional().isIn(invitationStatuses).withMessage('Invalid invitation status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

export const acceptInvitationRules = [
  body('token').isUUID(4).withMessage('Invalid invitation token'),
];
