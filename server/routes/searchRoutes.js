import { Router } from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiters.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import { globalSearchRules, validate } from '../validators/searchValidators.js';

const router = Router();

router.get(
  '/',
  protect,
  tenantContext,
  requirePermission('search:read'),
  searchLimiter,
  globalSearchRules,
  validate,
  globalSearch,
);

export default router;
