import { body, validationResult } from 'express-validator';

const passwordMessage = 'Password must be at least 8 characters';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  return next();
};

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be between 2 and 60 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage(passwordMessage),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('avatar')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Avatar must be a valid URL'),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage(passwordMessage),
];

export const deleteAccountRules = [body('password').notEmpty().withMessage('Password is required')];
