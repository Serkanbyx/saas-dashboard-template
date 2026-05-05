import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.LOG_LEVEL = 'silent';

vi.mock('../services/emailService.js', () => ({
  sendInvitationEmail: vi.fn(async () => ({ sent: false, skipped: true })),
  sendWelcomeEmail: vi.fn(async () => ({ sent: false, skipped: true })),
  sendRoleChangedEmail: vi.fn(async () => ({ sent: false, skipped: true })),
  sendPlanChangedEmail: vi.fn(async () => ({ sent: false, skipped: true })),
  sendOrgSuspendedEmail: vi.fn(async () => ({ sent: false, skipped: true })),
}));

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
