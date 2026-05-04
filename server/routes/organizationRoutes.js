import { Router } from 'express';
import {
  createOrg,
  deleteOrg,
  getMyOrgs,
  getOrgById,
  updateOrg,
} from '../controllers/organizationController.js';
import { protect } from '../middleware/auth.js';
import { requireOrgRole } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import {
  createOrgRules,
  deleteOrgRules,
  updateOrgRules,
} from '../validators/organizationValidators.js';

const router = Router();

/**
 * @openapi
 * /organizations:
 *   post:
 *     summary: Create an organization
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Demo Org" }
 *               description: { type: string, example: "Demo organization description" }
 *               logo: { type: string, example: "https://example.com/logo.png" }
 *     responses:
 *       201:
 *         description: Organization created
 *       400:
 *         description: Validation error
 */
router.post('/', protect, createOrgRules, validate, createOrg);

/**
 * @openapi
 * /organizations/mine:
 *   get:
 *     summary: List organizations for the current user
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: Organization list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizations:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Organization' }
 */
router.get('/mine', protect, getMyOrgs);

/**
 * @openapi
 * /organizations/{orgId}:
 *   get:
 *     summary: Get an organization by id
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
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
router.get('/:orgId', protect, tenantContext, getOrgById);

/**
 * @openapi
 * /organizations/{orgId}:
 *   patch:
 *     summary: Update an organization
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
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
 *               name: { type: string, example: "Demo Org" }
 *               description: { type: string, example: "Updated description" }
 *               logo: { type: string, example: "https://example.com/logo.png" }
 *     responses:
 *       200:
 *         description: Organization updated
 *       403:
 *         description: Forbidden
 */
router.patch(
  '/:orgId',
  protect,
  tenantContext,
  requireOrgRole(['owner', 'admin']),
  updateOrgRules,
  validate,
  updateOrg,
);

/**
 * @openapi
 * /organizations/{orgId}:
 *   delete:
 *     summary: Delete an organization
 *     tags: [Organizations]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
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
 *         description: Organization deleted
 *       403:
 *         description: Forbidden
 */
router.delete(
  '/:orgId',
  protect,
  tenantContext,
  requireOrgRole(['owner']),
  deleteOrgRules,
  validate,
  deleteOrg,
);

export default router;
