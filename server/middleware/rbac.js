import { PERMISSIONS } from '../utils/constants.js';

export const requireOrgRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.membership) {
    return res.status(403).json({ success: false, message: 'No organization context' });
  }

  if (!allowedRoles.includes(req.membership.role)) {
    return res.status(403).json({
      success: false,
      message: `Requires one of: ${allowedRoles.join(', ')}`,
    });
  }

  return next();
};

export const requirePermission = (permission) => (req, res, next) => {
  const allowedRoles = PERMISSIONS[permission] || [];

  if (!allowedRoles.includes(req.membership?.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  return next();
};
