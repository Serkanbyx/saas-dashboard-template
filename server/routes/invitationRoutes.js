import { Router } from 'express';
import {
  acceptInvitation,
  createInvitation,
  getInvitationByToken,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '../controllers/invitationController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { inviteLimiter } from '../middleware/rateLimiters.js';
import { tenantContext } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import {
  acceptInvitationRules,
  createInvitationRules,
  invitationIdParamRule,
  invitationTokenParamRule,
  listInvitationRules,
} from '../validators/invitationValidators.js';

const router = Router();

/**
 * @openapi
 * /invitations:
 *   post:
 *     summary: Invite a user to the current organization
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: "invitee@example.com" }
 *               role: { type: string, enum: [admin, member], example: "member" }
 *     responses:
 *       201:
 *         description: Invitation created
 *       400:
 *         description: Invalid invitation request
 */
router.post(
  '/',
  protect,
  tenantContext,
  requirePermission('members:invite'),
  inviteLimiter,
  createInvitationRules,
  validate,
  createInvitation,
);

/**
 * @openapi
 * /invitations:
 *   get:
 *     summary: List invitations for the current organization
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, accepted, expired, revoked] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: Invitation list
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, tenantContext, requirePermission('members:invite'), listInvitationRules, validate, listInvitations);

/**
 * @openapi
 * /invitations/by-token/{token}:
 *   get:
 *     summary: Get invitation details by token
 *     tags: [Invitations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation details
 *       404:
 *         description: Invitation not found
 */
router.get('/by-token/:token', invitationTokenParamRule, validate, getInvitationByToken);

/**
 * @openapi
 * /invitations/accept:
 *   post:
 *     summary: Accept an invitation
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string, example: "invitation-token" }
 *     responses:
 *       200:
 *         description: Invitation accepted
 *       400:
 *         description: Invalid or expired invitation
 */
router.post('/accept', protect, acceptInvitationRules, validate, acceptInvitation);

/**
 * @openapi
 * /invitations/{invitationId}:
 *   delete:
 *     summary: Revoke a pending invitation
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation revoked
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:invitationId',
  protect,
  tenantContext,
  requirePermission('members:invite'),
  invitationIdParamRule,
  validate,
  revokeInvitation,
);

/**
 * @openapi
 * /invitations/{invitationId}/resend:
 *   post:
 *     summary: Resend a pending invitation
 *     tags: [Invitations]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invitation resent
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:invitationId/resend',
  protect,
  tenantContext,
  requirePermission('members:invite'),
  inviteLimiter,
  invitationIdParamRule,
  validate,
  resendInvitation,
);

export default router;
