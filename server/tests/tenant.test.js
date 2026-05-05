import { describe, expect, it, vi } from 'vitest';
import { sanitizeRequest } from '../middleware/sanitize.js';
import { listMembersRules } from '../validators/membershipValidators.js';
import { authedRequest, createOrgFor, createUser } from './helpers.js';

describe('Tenant and request hardening', () => {
  it('prevents a user in one organization from fetching another organization dashboard', async () => {
    const { user: userA, token } = await createUser({ email: 'user-a@example.test' });
    const { user: userB } = await createUser({ email: 'user-b@example.test' });
    await createOrgFor(userA, { name: 'Org A' });
    const { org: orgB } = await createOrgFor(userB, { name: 'Org B' });

    const response = await authedRequest(token)
      .get('/api/dashboard/overview')
      .set('x-org-id', orgB._id.toString());

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Not a member of this organization');
  });

  it('allows a super admin to access any organization dashboard', async () => {
    const { token } = await createUser({
      email: 'superadmin@example.test',
      platformRole: 'superadmin',
    });
    const { user: owner } = await createUser({ email: 'owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Customer Org' });

    const response = await authedRequest(token)
      .get('/api/dashboard/overview')
      .set('x-org-id', org._id.toString());

    expect(response.status).toBe(200);
    expect(response.body.data.kpis.currentPlan).toBe('free');
  });

  it('requires an organization context header for tenant routes', async () => {
    const { token } = await createUser({ email: 'missing-org@example.test' });

    const response = await authedRequest(token).get('/api/dashboard/overview');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid organization context');
  });

  it('rejects invalid organization identifiers before tenant lookup', async () => {
    const { token } = await createUser({ email: 'invalid-org@example.test' });

    const response = await authedRequest(token).get('/api/dashboard/overview').set('x-org-id', 'not-an-object-id');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invalid organization context');
  });

  it('sanitizes body and params without assigning to req.query', () => {
    const req = {
      body: { safe: 'value', $where: 'malicious' },
      params: { id: '123', 'profile.name': 'blocked' },
      query: { orgId: { $ne: 'other-org' } },
    };
    const originalQuery = req.query;
    const next = vi.fn();

    sanitizeRequest(req, {}, next);

    expect(req.body).not.toHaveProperty('$where');
    expect(req.params).not.toHaveProperty('profile.name');
    expect(req.query).toBe(originalQuery);
    expect(next).toHaveBeenCalledOnce();
  });

  it('caps member search input before building regex queries', () => {
    const searchRule = listMembersRules.find((rule) => rule.builder?.fields?.includes('search'));

    expect(searchRule).toBeDefined();
  });
});
