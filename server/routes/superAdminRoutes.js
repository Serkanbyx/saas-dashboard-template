import { Router } from 'express';
import {
  forceDeleteOrg,
  getOrgDetails,
  getPlatformStats,
  listAllOrgs,
  listAllUsers,
  restoreOrg,
  suspendOrg,
  updateUserStatus,
} from '../controllers/superAdminController.js';
import { protect, superAdminOnly } from '../middleware/auth.js';
import {
  forceDeleteOrgRules,
  listAllOrgsRules,
  listAllUsersRules,
  orgIdParamRule,
  suspendOrgRules,
  updateUserStatusRules,
  userIdParamRule,
  validate,
} from '../validators/superAdminValidators.js';

const router = Router();

router.use(protect, superAdminOnly);

router.get('/stats', getPlatformStats);
router.get('/orgs', listAllOrgsRules, validate, listAllOrgs);
router.get('/orgs/:orgId', orgIdParamRule, validate, getOrgDetails);
router.patch('/orgs/:orgId/suspend', suspendOrgRules, validate, suspendOrg);
router.patch('/orgs/:orgId/restore', orgIdParamRule, validate, restoreOrg);
router.delete('/orgs/:orgId', forceDeleteOrgRules, validate, forceDeleteOrg);
router.get('/users', listAllUsersRules, validate, listAllUsers);
router.patch('/users/:userId', updateUserStatusRules, validate, updateUserStatus);

export default router;
