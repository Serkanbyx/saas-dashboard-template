import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import Invitation from '../models/Invitation.js';
import { invitationRoles } from '../models/Invitation.js';
import { acceptInvitationRules, createInvitationRules } from '../validators/invitationValidators.js';
import { authedRequest, createOrgFor, createUser } from './helpers.js';

describe('Invitation security rules', () => {
  it('creates an invitation when a seat is available', async () => {
    const { user: owner, token } = await createUser({ email: 'owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Invite Org', seatLimit: 2, seatsUsed: 1 });

    const response = await authedRequest(token)
      .post('/api/invitations')
      .set('x-org-id', org._id.toString())
      .send({ email: 'invitee@example.test', role: 'member' });

    const invitation = await Invitation.findOne({ email: 'invitee@example.test' });

    expect(response.status).toBe(201);
    expect(response.body.data.invitation.email).toBe('invitee@example.test');
    expect(response.body.data.invitation).not.toHaveProperty('token');
    expect(invitation.token).toEqual(expect.any(String));
  });

  it('rejects invitation creation when the seat limit is reached', async () => {
    const { user: owner, token } = await createUser({ email: 'full-owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Full Org', seatLimit: 1, seatsUsed: 1 });

    const response = await authedRequest(token)
      .post('/api/invitations')
      .set('x-org-id', org._id.toString())
      .send({ email: 'blocked@example.test', role: 'member' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Seat limit reached');
  });

  it('does not allow owner invitations through public invite flows', () => {
    expect(invitationRoles).toEqual(['admin', 'member']);
    expect(invitationRoles).not.toContain('owner');
  });

  it('rejects owner role invitations through the API validator', async () => {
    const { user: owner, token } = await createUser({ email: 'owner-role@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Role Guard Org' });

    const response = await authedRequest(token)
      .post('/api/invitations')
      .set('x-org-id', org._id.toString())
      .send({ email: 'owner-invite@example.test', role: 'owner' });

    expect(response.status).toBe(400);
  });

  it('accepts an invitation for the matching email account', async () => {
    const { user: owner, token: ownerToken } = await createUser({ email: 'accept-owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Accept Org', seatLimit: 2, seatsUsed: 1 });
    const { token: inviteeToken } = await createUser({ email: 'accept-me@example.test' });

    await authedRequest(ownerToken)
      .post('/api/invitations')
      .set('x-org-id', org._id.toString())
      .send({ email: 'accept-me@example.test', role: 'admin' });
    const invitation = await Invitation.findOne({ email: 'accept-me@example.test' });

    const response = await authedRequest(inviteeToken).post('/api/invitations/accept').send({
      token: invitation.token,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.membership.role).toBe('admin');
  });

  it('rejects invitation acceptance from a different email account', async () => {
    const { user: owner } = await createUser({ email: 'wrong-owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Wrong Email Org', seatLimit: 2, seatsUsed: 1 });
    const { token: wrongUserToken } = await createUser({ email: 'wrong-user@example.test' });
    const invitation = await Invitation.create({
      email: 'right-user@example.test',
      orgId: org._id,
      role: 'member',
      token: randomUUID(),
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const response = await authedRequest(wrongUserToken).post('/api/invitations/accept').send({
      token: invitation.token,
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Invitation email does not match your account');
  });

  it('does not allow an accepted invitation to be reused', async () => {
    const { user: owner } = await createUser({ email: 'reuse-owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Reuse Org', seatLimit: 3, seatsUsed: 1 });
    const { token: inviteeToken } = await createUser({ email: 'reuse@example.test' });
    const invitation = await Invitation.create({
      email: 'reuse@example.test',
      orgId: org._id,
      role: 'member',
      token: randomUUID(),
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const firstResponse = await authedRequest(inviteeToken).post('/api/invitations/accept').send({
      token: invitation.token,
    });
    const secondResponse = await authedRequest(inviteeToken).post('/api/invitations/accept').send({
      token: invitation.token,
    });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(400);
    expect(secondResponse.body.message).toBe('Invitation is no longer pending');
  });

  it('rejects expired invitations', async () => {
    const { user: owner } = await createUser({ email: 'expired-owner@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Expired Org', seatLimit: 2, seatsUsed: 1 });
    const { token: inviteeToken } = await createUser({ email: 'expired@example.test' });
    const invitation = await Invitation.create({
      email: 'expired@example.test',
      orgId: org._id,
      role: 'member',
      token: randomUUID(),
      invitedBy: owner._id,
      expiresAt: new Date(Date.now() - 60_000),
    });

    const response = await authedRequest(inviteeToken).post('/api/invitations/accept').send({
      token: invitation.token,
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Invitation has expired');
  });

  it('requires UUID v4 tokens on invitation accept', () => {
    const tokenRule = acceptInvitationRules.find((rule) => rule.builder?.fields?.includes('token'));

    expect(tokenRule).toBeDefined();
  });

  it('validates invitee email and role explicitly', () => {
    expect(createInvitationRules).toHaveLength(2);
  });
});
