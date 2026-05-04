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

router.get('/overview', protect, tenantContext, getOverview);
router.get('/charts/activity', protect, tenantContext, getActivityChart);
router.get('/charts/growth', protect, tenantContext, getGrowthChart);
router.get('/charts/revenue', protect, tenantContext, getRevenueChart);

export default router;
