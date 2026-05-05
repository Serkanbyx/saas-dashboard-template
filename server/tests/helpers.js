import request from 'supertest';
import { app } from '../index.js';
import Membership from '../models/Membership.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

let sequence = 0;

const getNextSequence = () => {
  sequence += 1;
  return sequence;
};

export const createUser = async ({
  email,
  name = 'Test User',
  password = 'Password123',
  platformRole = 'user',
} = {}) => {
  const id = getNextSequence();
  const user = await User.create({
    name,
    email: email || `user${id}@example.test`,
    password,
    platformRole,
  });

  return { user, token: generateToken(user._id), password };
};

export const createOrgFor = async (
  user,
  { name = 'Test Organization', role = 'owner', plan = 'free', seatLimit = 5, seatsUsed = 1 } = {},
) => {
  const id = getNextSequence();
  const org = await Organization.create({
    name,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`,
    ownerId: user._id,
    plan,
    seatLimit,
    seatsUsed,
  });
  const membership = await Membership.create({ userId: user._id, orgId: org._id, role });

  return { org, membership };
};

export const addMemberToOrg = async (user, org, { role = 'member' } = {}) => {
  const membership = await Membership.create({ userId: user._id, orgId: org._id, role });
  await Organization.updateOne({ _id: org._id }, { $inc: { seatsUsed: 1 } });

  return membership;
};

export const authedRequest = (token) => ({
  delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
  patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
  post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
});
