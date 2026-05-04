import { Router } from 'express';
import {
  getMembersOverview,
  leaveOrg,
  listMembers,
  removeMember,
  transferOwnership,
  updateMemberRole,
} from '../controllers/membershipController.js';
import { protect } from '../middleware/auth.js';
import { requireOrgRole, requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import {
  membershipIdParamRule,
  transferOwnershipRules,
  updateMemberRoleRules,
  validate,
} from '../validators/membershipValidators.js';

const router = Router();

/**
 * @openapi
 * /memberships:
 *   get:
 *     summary: List members of the current organization
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: Member list
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, tenantContext, requirePermission('members:read'), listMembers);

/**
 * @openapi
 * /memberships/overview:
 *   get:
 *     summary: Get member counts, members, and pending invitations
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Membership overview
 *       403:
 *         description: Forbidden
 */
router.get('/overview', protect, tenantContext, requirePermission('members:read'), getMembersOverview);

/**
 * @openapi
 * /memberships/me:
 *   delete:
 *     summary: Leave the current organization
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Organization left
 *       400:
 *         description: Owner must transfer ownership first
 */
router.delete('/me', protect, tenantContext, leaveOrg);

/**
 * @openapi
 * /memberships/{membershipId}:
 *   patch:
 *     summary: Update a member role
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: membershipId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [admin, member], example: "member" }
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: Forbidden
 */
router.patch(
  '/:membershipId',
  protect,
  tenantContext,
  requirePermission('members:update'),
  updateMemberRoleRules,
  validate,
  updateMemberRole,
);

/**
 * @openapi
 * /memberships/{membershipId}:
 *   delete:
 *     summary: Remove a member from the current organization
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: membershipId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:membershipId',
  protect,
  tenantContext,
  requirePermission('members:remove'),
  membershipIdParamRule,
  validate,
  removeMember,
);

/**
 * @openapi
 * /memberships/{membershipId}/transfer-ownership:
 *   post:
 *     summary: Transfer organization ownership to another member
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: membershipId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ownership transferred
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:membershipId/transfer-ownership',
  protect,
  tenantContext,
  requireOrgRole(['owner']),
  transferOwnershipRules,
  validate,
  transferOwnership,
);

export default router;
