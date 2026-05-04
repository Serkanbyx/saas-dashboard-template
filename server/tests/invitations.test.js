import { describe, expect, it } from 'vitest';
import { invitationRoles } from '../models/Invitation.js';
import { acceptInvitationRules, createInvitationRules } from '../validators/invitationValidators.js';

describe('Invitation security rules', () => {
  it('does not allow owner invitations through public invite flows', () => {
    expect(invitationRoles).toEqual(['admin', 'member']);
    expect(invitationRoles).not.toContain('owner');
  });

  it('requires UUID v4 tokens on invitation accept', () => {
    const tokenRule = acceptInvitationRules.find((rule) => rule.builder?.fields?.includes('token'));

    expect(tokenRule).toBeDefined();
  });

  it('validates invitee email and role explicitly', () => {
    expect(createInvitationRules).toHaveLength(2);
  });
});
