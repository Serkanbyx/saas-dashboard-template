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
