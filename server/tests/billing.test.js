import { describe, expect, it } from 'vitest';
import BillingRecord from '../models/BillingRecord.js';
import { addMemberToOrg, authedRequest, createOrgFor, createUser } from './helpers.js';

describe('Billing API', () => {
  it('blocks downgrades while the organization is over the free seat limit', async () => {
    const { user: owner, token } = await createUser({ email: 'billing-owner@example.test' });
    const { org } = await createOrgFor(owner, {
      name: 'Large Pro Org',
      plan: 'pro',
      seatLimit: 50,
      seatsUsed: 6,
    });

    const response = await authedRequest(token)
      .post('/api/billing/plan/change')
      .set('x-org-id', org._id.toString())
      .send({ newPlan: 'free' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Remove members before downgrading to the Free plan');
  });

  it('creates a billing record when the plan changes', async () => {
    const { user: owner, token } = await createUser({ email: 'plan-owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Plan Change Org' });

    const response = await authedRequest(token)
      .post('/api/billing/plan/change')
      .set('x-org-id', org._id.toString())
      .send({ newPlan: 'pro' });
    const billingRecord = await BillingRecord.findOne({ orgId: org._id });

    expect(response.status).toBe(200);
    expect(response.body.data.plan.plan).toBe('pro');
    expect(billingRecord.type).toBe('upgrade');
    expect(billingRecord.previousPlan).toBe('free');
    expect(billingRecord.newPlan).toBe('pro');
  });

  it('prevents non-owners from changing the plan', async () => {
    const { user: owner } = await createUser({ email: 'non-owner-billing-owner@example.test' });
    const { user: member, token: memberToken } = await createUser({ email: 'non-owner-billing@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Billing Guard Org' });
    await addMemberToOrg(member, org, { role: 'admin' });

    const response = await authedRequest(memberToken)
      .post('/api/billing/plan/change')
      .set('x-org-id', org._id.toString())
      .send({ newPlan: 'pro' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden');
  });
});
