import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import env from '../config/env.js';
import { logger } from '../config/logger.js';
import User from '../models/User.js';

const exitWithError = (message) => {
  logger.error(message);
  process.exit(1);
};

const seedSuperAdmin = async () => {
  if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) {
    exitWithError('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required.');
  }

  if (env.SUPER_ADMIN_PASSWORD.length < 8) {
    exitWithError('SUPER_ADMIN_PASSWORD must be at least 8 characters.');
  }

  await connectDB();

  const existingUser = await User.findOne({ email: env.SUPER_ADMIN_EMAIL });

  if (existingUser) {
    existingUser.platformRole = 'superadmin';
    await existingUser.save();
    logger.info({ email: existingUser.email }, 'Existing user promoted to super admin');
    return;
  }

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: env.SUPER_ADMIN_EMAIL,
    password: env.SUPER_ADMIN_PASSWORD,
    platformRole: 'superadmin',
  });

  logger.info({ email: superAdmin.email }, 'Super admin user created');
};

try {
  await seedSuperAdmin();
  await mongoose.connection.close();
  process.exit(0);
} catch (error) {
  logger.error({ err: error }, 'Failed to seed super admin');
  await mongoose.connection.close();
  process.exit(1);
}
