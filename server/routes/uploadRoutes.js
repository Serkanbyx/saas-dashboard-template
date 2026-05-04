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

/**
 * @openapi
 * /uploads/avatar:
 *   post:
 *     summary: Upload an avatar image for the current user
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *       400:
 *         description: Invalid upload
 */
router.post('/avatar', protect, uploadLimiter, uploadAvatar.single('image'), uploadUserAvatar);

/**
 * @openapi
 * /uploads/org-logo:
 *   post:
 *     summary: Upload a logo image for the current organization
 *     tags: [Uploads]
 *     security: [{ bearerAuth: [], orgIdHeader: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Organization logo uploaded
 *       403:
 *         description: Forbidden
 */
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
