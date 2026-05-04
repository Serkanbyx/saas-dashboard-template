import { Router } from 'express';
import {
  changePassword,
  completeOnboarding,
  deleteAccount,
  getMe,
  login,
  register,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import {
  changePasswordRules,
  deleteAccountRules,
  loginRules,
  registerRules,
  updateProfileRules,
  validate,
} from '../validators/authValidators.js';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Demo User" }
 *               email: { type: string, format: email, example: "user@example.com" }
 *               password: { type: string, format: password, example: "StrongPassword123" }
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Validation or registration error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post('/register', authLimiter, registerRules, validate, register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "user@example.com" }
 *               password: { type: string, format: password, example: "StrongPassword123" }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, loginRules, validate, login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, getMe);

/**
 * @openapi
 * /auth/me:
 *   patch:
 *     summary: Update the current user's profile
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Demo User" }
 *               avatar: { type: string, example: "https://example.com/avatar.png" }
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Invalid profile update
 */
router.patch('/me', protect, updateProfileRules, validate, updateProfile);

/**
 * @openapi
 * /auth/me/password:
 *   patch:
 *     summary: Change the current user's password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password, example: "CurrentPassword123" }
 *               newPassword: { type: string, format: password, example: "NewPassword123" }
 *     responses:
 *       200:
 *         description: Password updated
 *       400:
 *         description: Current password is incorrect
 */
router.patch('/me/password', protect, changePasswordRules, validate, changePassword);

/**
 * @openapi
 * /auth/me/complete-onboarding:
 *   post:
 *     summary: Mark onboarding as completed for the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Onboarding completed
 */
router.post('/me/complete-onboarding', protect, completeOnboarding);

/**
 * @openapi
 * /auth/me:
 *   delete:
 *     summary: Delete the current user's account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, format: password, example: "StrongPassword123" }
 *     responses:
 *       200:
 *         description: Account deleted
 *       400:
 *         description: Password confirmation failed
 */
router.delete('/me', protect, deleteAccountRules, validate, deleteAccount);

export default router;
