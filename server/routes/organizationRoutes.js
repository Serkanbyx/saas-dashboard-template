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
import {
  createOrgRules,
  deleteOrgRules,
  updateOrgRules,
  validate,
} from '../validators/organizationValidators.js';

const router = Router();

router.post('/', protect, createOrgRules, validate, createOrg);
router.get('/mine', protect, getMyOrgs);
router.get('/:orgId', protect, tenantContext, getOrgById);
router.patch(
  '/:orgId',
  protect,
  tenantContext,
  requireOrgRole(['owner', 'admin']),
  updateOrgRules,
  validate,
  updateOrg,
);
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
