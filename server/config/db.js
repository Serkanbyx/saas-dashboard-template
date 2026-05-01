import mongoose from 'mongoose';
import env from './env.js';
import { logger } from './logger.js';

export const connectDB = async () => {
  if (!env.MONGO_URI) {
    logger.error('MONGO_URI is required to connect to MongoDB.');
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(env.MONGO_URI);
    logger.info({ host: connection.connection.host }, 'MongoDB connected');
  } catch (error) {
    logger.error({ err: error }, 'MongoDB connection failed');
    process.exit(1);
  }
};
