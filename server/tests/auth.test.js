import request from 'supertest';
import { describe, expect, it } from 'vitest';
import User from '../models/User.js';
import { app } from '../index.js';
import { createUser } from './helpers.js';

describe('Auth API', () => {
  it('registers a user successfully without exposing the password', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Demo User',
      email: 'demo@example.test',
      password: 'StrongPassword123',
      platformRole: 'superadmin',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe('demo@example.test');
    expect(response.body.data.user.platformRole).toBe('user');
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  it('returns a generic error for duplicate registration attempts', async () => {
    await createUser({ email: 'duplicate@example.test' });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Duplicate User',
      email: 'duplicate@example.test',
      password: 'StrongPassword123',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Registration failed');
  });

  it('logs in with valid credentials', async () => {
    await createUser({ email: 'login@example.test', password: 'StrongPassword123' });

    const response = await request(app).post('/api/auth/login').send({
      email: 'login@example.test',
      password: 'StrongPassword123',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe('login@example.test');
  });

  it('returns the same generic error for wrong passwords and unknown emails', async () => {
    await createUser({ email: 'known@example.test', password: 'StrongPassword123' });

    const wrongPasswordResponse = await request(app).post('/api/auth/login').send({
      email: 'known@example.test',
      password: 'WrongPassword123',
    });
    const unknownEmailResponse = await request(app).post('/api/auth/login').send({
      email: 'unknown@example.test',
      password: 'WrongPassword123',
    });

    expect(wrongPasswordResponse.status).toBe(401);
    expect(unknownEmailResponse.status).toBe(401);
    expect(wrongPasswordResponse.body.message).toBe('Invalid email or password');
    expect(unknownEmailResponse.body.message).toBe(wrongPasswordResponse.body.message);
  });

  it('keeps passwords excluded from default query results and JSON output', () => {
    expect(User.schema.path('password').options.select).toBe(false);

    const serializedUser = new User({
      name: 'Demo User',
      email: 'demo@example.test',
      password: 'StrongPassword123',
    }).toJSON();

    expect(serializedUser).not.toHaveProperty('password');
    expect(serializedUser.platformRole).toBe('user');
  });

  it('does not allow platformRole assignment through registration', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'Role User',
      email: 'role@example.test',
      password: 'StrongPassword123',
      platformRole: 'superadmin',
    });
    const user = await User.findOne({ email: 'role@example.test' });

    expect(response.status).toBe(201);
    expect(user.platformRole).toBe('user');
  });
});
