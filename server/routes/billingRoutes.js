import { Router } from 'express';
import {
  changePlan,
  getCurrentPlan,
  getInvoice,
  listBillingHistory,
} from '../controllers/billingController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import {
  changePlanRules,
  invoiceNumberParamRule,
  listBillingHistoryRules,
  validate,
} from '../validators/billingValidators.js';

const router = Router();

/**
 * @openapi
 * /billing/plan:
 *   get:
 *     summary: Get the current organization billing plan
 *     tags: [Billing]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Current plan details
 *       401:
 *         description: Unauthorized
 */
router.get('/plan', protect, tenantContext, getCurrentPlan);

/**
 * @openapi
 * /billing/plan/change:
 *   post:
 *     summary: Change the current organization billing plan
 *     tags: [Billing]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPlan]
 *             properties:
 *               newPlan: { type: string, enum: [free, pro], example: "pro" }
 *     responses:
 *       200:
 *         description: Plan changed
 *       403:
 *         description: Forbidden
 */
router.post(
  '/plan/change',
  protect,
  tenantContext,
  requirePermission('org:billing'),
  changePlanRules,
  validate,
  changePlan,
);

/**
 * @openapi
 * /billing/history:
 *   get:
 *     summary: List billing history for the current organization
 *     tags: [Billing]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: Billing records
 *       403:
 *         description: Forbidden
 */
router.get(
  '/history',
  protect,
  tenantContext,
  requirePermission('org:billing'),
  listBillingHistoryRules,
  validate,
  listBillingHistory,
);

/**
 * @openapi
 * /billing/invoice/{invoiceNumber}:
 *   get:
 *     summary: Get an invoice by invoice number
 *     tags: [Billing]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get(
  '/invoice/:invoiceNumber',
  protect,
  tenantContext,
  requirePermission('org:billing'),
  invoiceNumberParamRule,
  validate,
  getInvoice,
);

export default router;
