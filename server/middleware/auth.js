import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';

const getBearerToken = (req) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.split(' ')[1];
};

const getAuthenticatedUser = async (req) => {
  const token = getBearerToken(req);

  if (!token || !env.JWT_SECRET) {
    return null;
  }

  const decoded = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(decoded.id);

  if (!user?.isActive) {
    return null;
  }

  return user;
};

export const protect = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

export const optionalAuth = async (req, _res, next) => {
  try {
    req.user = await getAuthenticatedUser(req);
  } catch (_error) {
    req.user = null;
  }

  next();
};

export const superAdminOnly = (req, res, next) => {
  if (req.user?.platformRole !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }

  return next();
};
