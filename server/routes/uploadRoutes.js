import { Router } from 'express';
import {
  uploadOrganizationLogo,
  uploadUserAvatar,
} from '../controllers/uploadController.js';
import { protect } from '../middleware/auth.js';
import { uploadOrgLogo, uploadAvatar } from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimiters.js';

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
 *     summary: Upload an organization logo image
 *     tags: [Uploads]
 *     security: [{ bearerAuth: [] }]
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
  uploadLimiter,
  uploadOrgLogo.single('image'),
  uploadOrganizationLogo,
);

export default router;
