import { Router } from 'express';
import { globalSearch } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiters.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import { globalSearchRules } from '../validators/searchValidators.js';

const router = Router();

/**
 * @openapi
 * /search:
 *   get:
 *     summary: Search organization members, invitations, activities, and billing records
 *     tags: [Search]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: types
 *         schema: { type: string, example: "members,invitations" }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 10 }
 *     responses:
 *       200:
 *         description: Search results
 *       403:
 *         description: Forbidden
 */
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
