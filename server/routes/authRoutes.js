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

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfileRules, validate, updateProfile);
router.patch('/me/password', protect, changePasswordRules, validate, changePassword);
router.post('/me/complete-onboarding', protect, completeOnboarding);
router.delete('/me', protect, deleteAccountRules, validate, deleteAccount);

export default router;
