import { Router } from 'express';
import {
  acceptInvitation,
  createInvitation,
  getInvitationByToken,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from '../controllers/invitationController.js';
import { protect } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { inviteLimiter } from '../middleware/rateLimiters.js';
import { tenantContext } from '../middleware/tenant.js';
import {
  acceptInvitationRules,
  createInvitationRules,
  invitationIdParamRule,
  invitationTokenParamRule,
  listInvitationRules,
  validate,
} from '../validators/invitationValidators.js';

const router = Router();

router.post(
  '/',
  protect,
  tenantContext,
  requirePermission('members:invite'),
  inviteLimiter,
  createInvitationRules,
  validate,
  createInvitation,
);
router.get('/', protect, tenantContext, requirePermission('members:invite'), listInvitationRules, validate, listInvitations);
router.get('/by-token/:token', invitationTokenParamRule, validate, getInvitationByToken);
router.post('/accept', protect, acceptInvitationRules, validate, acceptInvitation);
router.delete(
  '/:invitationId',
  protect,
  tenantContext,
  requirePermission('members:invite'),
  invitationIdParamRule,
  validate,
  revokeInvitation,
);
router.post(
  '/:invitationId/resend',
  protect,
  tenantContext,
  requirePermission('members:invite'),
  inviteLimiter,
  invitationIdParamRule,
  validate,
  resendInvitation,
);

export default router;
