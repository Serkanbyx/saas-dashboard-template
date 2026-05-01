import rateLimit from 'express-rate-limit';

const tooManyRequestsResponse = {
  success: false,
  message: 'Too many requests, please try again later.',
};

const createLimiter = ({ windowMs, max }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyRequestsResponse,
  });

export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const inviteLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
});

export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
});

export const searchLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
});

export const superAdminLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
