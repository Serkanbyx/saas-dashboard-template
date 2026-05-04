import { Router } from 'express';
import { getActivityStats, listActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import { listActivityRules, validate } from '../validators/activityValidators.js';

const router = Router();

/**
 * @openapi
 * /activities/stats:
 *   get:
 *     summary: Get activity statistics for the current organization
 *     tags: [Activities]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Activity statistics
 *       403:
 *         description: Forbidden
 */
router.get('/stats', protect, tenantContext, requirePermission('activity:read'), getActivityStats);

/**
 * @openapi
 * /activities:
 *   get:
 *     summary: List activity logs for the current organization
 *     tags: [Activities]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: Activity log list
 *       403:
 *         description: Forbidden
 */
router.get('/', protect, tenantContext, requirePermission('activity:read'), listActivityRules, validate, listActivity);

export default router;
