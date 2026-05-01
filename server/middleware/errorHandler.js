import env from '../config/env.js';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Server error';

  if (req.log) {
    req.log.error({ err }, message);
  } else {
    logger.error({ err }, message);
  }

  const response = {
    success: false,
    message: env.NODE_ENV === 'production' && statusCode >= 500 ? 'Server error' : message,
  };

  if (env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
