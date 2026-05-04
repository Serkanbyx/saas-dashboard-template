import { Router } from 'express';
import {
  getActivityChart,
  getGrowthChart,
  getOverview,
  getRevenueChart,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

/**
 * @openapi
 * /dashboard/overview:
 *   get:
 *     summary: Get dashboard overview metrics
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Dashboard overview
 *       401:
 *         description: Unauthorized
 */
router.get('/overview', protect, tenantContext, getOverview);

/**
 * @openapi
 * /dashboard/charts/activity:
 *   get:
 *     summary: Get activity chart data
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Activity chart data
 */
router.get('/charts/activity', protect, tenantContext, getActivityChart);

/**
 * @openapi
 * /dashboard/charts/growth:
 *   get:
 *     summary: Get member growth chart data
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Growth chart data
 */
router.get('/charts/growth', protect, tenantContext, getGrowthChart);

/**
 * @openapi
 * /dashboard/charts/revenue:
 *   get:
 *     summary: Get revenue chart data
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     responses:
 *       200:
 *         description: Revenue chart data
 */
router.get('/charts/revenue', protect, tenantContext, getRevenueChart);

export default router;
