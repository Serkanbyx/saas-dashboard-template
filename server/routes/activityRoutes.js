import { Router } from 'express';
import { getActivityStats, listActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import { listActivityRules, validate } from '../validators/activityValidators.js';

const router = Router();

router.get('/stats', protect, tenantContext, requirePermission('activity:read'), getActivityStats);
router.get('/', protect, tenantContext, requirePermission('activity:read'), listActivityRules, validate, listActivity);

export default router;
