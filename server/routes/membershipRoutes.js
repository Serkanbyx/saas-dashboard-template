import { Router } from 'express';
import {
  leaveOrg,
  listMembers,
  removeMember,
  transferOwnership,
  updateMemberRole,
} from '../controllers/membershipController.js';
import { protect } from '../middleware/auth.js';
import { requireOrgRole, requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';
import {
  membershipIdParamRule,
  transferOwnershipRules,
  updateMemberRoleRules,
  validate,
} from '../validators/membershipValidators.js';

const router = Router();

router.get('/', protect, tenantContext, requirePermission('members:read'), listMembers);
router.delete('/me', protect, tenantContext, leaveOrg);
router.patch(
  '/:membershipId',
  protect,
  tenantContext,
  requirePermission('members:update'),
  updateMemberRoleRules,
  validate,
  updateMemberRole,
);
router.delete(
  '/:membershipId',
  protect,
  tenantContext,
  requirePermission('members:remove'),
  membershipIdParamRule,
  validate,
  removeMember,
);
router.post(
  '/:membershipId/transfer-ownership',
  protect,
  tenantContext,
  requireOrgRole(['owner']),
  transferOwnershipRules,
  validate,
  transferOwnership,
);

export default router;
