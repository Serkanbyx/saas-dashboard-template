import { Router } from 'express';
import {
  forceDeleteOrg,
  getOrgDetails,
  getPlatformStats,
  listAllOrgs,
  listAllUsers,
  restoreOrg,
  suspendOrg,
  updateUserStatus,
} from '../controllers/superAdminController.js';
import { protect, superAdminOnly } from '../middleware/auth.js';
import {
  forceDeleteOrgRules,
  listAllOrgsRules,
  listAllUsersRules,
  orgIdParamRule,
  suspendOrgRules,
  updateUserStatusRules,
  userIdParamRule,
} from '../validators/superAdminValidators.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(protect, superAdminOnly);

/**
 * @openapi
 * /super-admin/stats:
 *   get:
 *     summary: Get platform-wide super admin statistics
 *     tags: [Super Admin]
 *     responses:
 *       200:
 *         description: Platform statistics
 *       403:
 *         description: Super admin access required
 */
router.get('/stats', getPlatformStats);

/**
 * @openapi
 * /super-admin/orgs:
 *   get:
 *     summary: List all organizations
 *     tags: [Super Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200:
 *         description: Organization list
 *       403:
 *         description: Super admin access required
 */
router.get('/orgs', listAllOrgsRules, validate, listAllOrgs);

/**
 * @openapi
 * /super-admin/orgs/{orgId}:
 *   get:
 *     summary: Get organization details as super admin
 *     tags: [Super Admin]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Organization not found
 */
router.get('/orgs/:orgId', orgIdParamRule, validate, getOrgDetails);

/**
 * @openapi
 * /super-admin/orgs/{orgId}/suspend:
 *   patch:
 *     summary: Suspend an organization
 *     tags: [Super Admin]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Policy review" }
 *     responses:
 *       200:
 *         description: Organization suspended
 *       403:
 *         description: Super admin access required
 */
router.patch('/orgs/:orgId/suspend', suspendOrgRules, validate, suspendOrg);

/**
 * @openapi
 * /super-admin/orgs/{orgId}/restore:
 *   patch:
 *     summary: Restore a suspended organization
 *     tags: [Super Admin]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Organization restored
 *       403:
 *         description: Super admin access required
 */
router.patch('/orgs/:orgId/restore', orgIdParamRule, validate, restoreOrg);

/**
 * @openapi
 * /super-admin/orgs/{orgId}:
 *   delete:
 *     summary: Permanently delete an organization
 *     tags: [Super Admin]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmName]
 *             properties:
 *               confirmName: { type: string, example: "Demo Org" }
 *     responses:
 *       200:
 *         description: Organization permanently deleted
 *       403:
 *         description: Super admin access required
 */
router.delete('/orgs/:orgId', forceDeleteOrgRules, validate, forceDeleteOrg);

/**
 * @openapi
 * /super-admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Super Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200:
 *         description: User list
 *       403:
 *         description: Super admin access required
 */
router.get('/users', listAllUsersRules, validate, listAllUsers);

/**
 * @openapi
 * /super-admin/users/{userId}:
 *   patch:
 *     summary: Update a user's active status
 *     tags: [Super Admin]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: User updated
 *       403:
 *         description: Super admin access required
 */
router.patch('/users/:userId', updateUserStatusRules, validate, updateUserStatus);

export default router;
