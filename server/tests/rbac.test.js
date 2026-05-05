import { describe, expect, it } from 'vitest';
import Membership from '../models/Membership.js';
import Organization from '../models/Organization.js';
import { addMemberToOrg, authedRequest, createOrgFor, createUser } from './helpers.js';

describe('Membership RBAC API', () => {
  it('prevents a member from deleting another member', async () => {
    const { user: owner } = await createUser({ email: 'rbac-owner@example.test' });
    const { user: actor, token: actorToken } = await createUser({ email: 'rbac-member@example.test' });
    const { user: target } = await createUser({ email: 'rbac-target@example.test' });
    const { org } = await createOrgFor(owner, { name: 'RBAC Org' });
    await addMemberToOrg(actor, org, { role: 'member' });
    const targetMembership = await addMemberToOrg(target, org, { role: 'member' });

    const response = await authedRequest(actorToken)
      .delete(`/api/memberships/${targetMembership._id}`)
      .set('x-org-id', org._id.toString());

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden');
  });

  it('prevents an admin from demoting the owner', async () => {
    const { user: owner } = await createUser({ email: 'owner-demote@example.test' });
    const { user: admin, token: adminToken } = await createUser({ email: 'admin-demote@example.test' });
    const { org, membership: ownerMembership } = await createOrgFor(owner, { name: 'Owner Guard Org' });
    await addMemberToOrg(admin, org, { role: 'admin' });

    const response = await authedRequest(adminToken)
      .patch(`/api/memberships/${ownerMembership._id}`)
      .set('x-org-id', org._id.toString())
      .send({ role: 'member' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Owner role cannot be changed');
  });

  it('prevents an admin from demoting another admin', async () => {
    const { user: owner } = await createUser({ email: 'admin-owner@example.test' });
    const { user: admin, token: adminToken } = await createUser({ email: 'admin-actor@example.test' });
    const { user: targetAdmin } = await createUser({ email: 'admin-target@example.test' });
    const { org } = await createOrgFor(owner, { name: 'Admin Guard Org' });
    await addMemberToOrg(admin, org, { role: 'admin' });
    const targetMembership = await addMemberToOrg(targetAdmin, org, { role: 'admin' });

    const response = await authedRequest(adminToken)
      .patch(`/api/memberships/${targetMembership._id}`)
      .set('x-org-id', org._id.toString())
      .send({ role: 'member' });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Admins cannot demote other admins');
  });

  it('allows an owner to transfer ownership', async () => {
    const password = 'Password123';
    const { user: owner, token: ownerToken } = await createUser({
      email: 'transfer-owner@example.test',
      password,
    });
    const { user: nextOwner } = await createUser({ email: 'next-owner@example.test' });
    const { org, membership: ownerMembership } = await createOrgFor(owner, { name: 'Transfer Org' });
    const nextOwnerMembership = await addMemberToOrg(nextOwner, org, { role: 'admin' });

    const response = await authedRequest(ownerToken)
      .post(`/api/memberships/${nextOwnerMembership._id}/transfer-ownership`)
      .set('x-org-id', org._id.toString())
      .send({ confirmPassword: password });
    const updatedOrg = await Organization.findById(org._id);
    const updatedOwnerMembership = await Membership.findById(ownerMembership._id);
    const updatedNextOwnerMembership = await Membership.findById(nextOwnerMembership._id);

    expect(response.status).toBe(200);
    expect(updatedOrg.ownerId.toString()).toBe(nextOwner._id.toString());
    expect(updatedOwnerMembership.role).toBe('admin');
    expect(updatedNextOwnerMembership.role).toBe('owner');
  });
});
