import { Router } from 'express';
import {
  uploadOrganizationLogo,
  uploadUserAvatar,
} from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { uploadOrgLogo, uploadAvatar } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';
import { requireOrgRole } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenant.js';

const router = Router();

router.post('/avatar', protect, uploadLimiter, uploadAvatar.single('image'), uploadUserAvatar);
router.post(
  '/org-logo',
  protect,
  tenantContext,
  requireOrgRole(['owner', 'admin']),
  uploadLimiter,
  uploadOrgLogo.single('image'),
  uploadOrganizationLogo,
);

export default router;
