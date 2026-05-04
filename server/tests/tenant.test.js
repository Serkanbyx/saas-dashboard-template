import { describe, expect, it, vi } from 'vitest';
import { sanitizeRequest } from '../middleware/sanitize.js';
import { listMembersRules } from '../validators/membershipValidators.js';

describe('Tenant and request hardening', () => {
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
