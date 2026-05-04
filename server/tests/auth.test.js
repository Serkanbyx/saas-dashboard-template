import { describe, expect, it } from 'vitest';
import User from '../models/User.js';

describe('User security model', () => {
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
});
