import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const generateToken = (userId) => {
  if (!env.JWT_SECRET) {
    throw Object.assign(new Error('JWT_SECRET is required'), { statusCode: 500 });
  }

  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};
