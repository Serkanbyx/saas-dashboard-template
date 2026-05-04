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

router.get('/plan', protect, tenantContext, getCurrentPlan);
router.post(
  '/plan/change',
  protect,
  tenantContext,
  requirePermission('org:billing'),
  changePlanRules,
  validate,
  changePlan,
);
router.get(
  '/history',
  protect,
  tenantContext,
  requirePermission('org:billing'),
  listBillingHistoryRules,
  validate,
  listBillingHistory,
);
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
