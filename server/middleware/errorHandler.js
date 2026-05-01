import env from '../config/env.js';
import { logger } from '../config/logger.js';

const getStatusCode = (err) => {
  if (err.statusCode || err.status) return err.statusCode || err.status;
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) return 400;
  return 500;
};

const getSafeMessage = (err, statusCode) => {
  if (env.NODE_ENV !== 'production') {
    return err.message || 'Server error';
  }

  if (err.name === 'ValidationError') return 'Validation failed';
  if (err.name === 'CastError') return 'Invalid resource identifier';
  if (err.code === 11000) return 'Duplicate resource';

  return err.message || (statusCode >= 500 ? 'Server error' : 'Request failed');
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = getStatusCode(err);
  const message = getSafeMessage(err, statusCode);

  if (req.log) {
    req.log.error({ err }, err.message || message);
  } else {
    logger.error({ err }, err.message || message);
  }

  const response = {
    success: false,
    message,
  };

  if (env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
