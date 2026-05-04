import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config({ quiet: true });

const parsePort = (value, fallback) => {
  const parsedPort = Number.parseInt(value, 10);
  return Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : fallback;
};

const parseBoolean = (value) => value === 'true';

const env = {
  PORT: parsePort(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: parsePort(process.env.EMAIL_PORT, 587),
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'SaaS Dashboard <noreply@saas.app>',
  LOG_LEVEL: process.env.LOG_LEVEL,
  EXPOSE_DOCS_IN_PROD: parseBoolean(process.env.EXPOSE_DOCS_IN_PROD),
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};

const requiredProductionEnv = [
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'CLIENT_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
  'SUPER_ADMIN_EMAIL',
  'SUPER_ADMIN_PASSWORD',
];

if (env.NODE_ENV === 'production') {
  const missingKeys = requiredProductionEnv.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    logger.fatal({ missingKeys }, 'Missing required production environment variables');
    process.exit(1);
  }

  if (env.JWT_SECRET.length < 32) {
    logger.fatal('JWT_SECRET must be at least 32 characters in production.');
    process.exit(1);
  }
}

export default env;
