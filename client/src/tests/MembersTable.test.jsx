import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MembersTable } from '../components/members/MembersTable';

describe('MembersTable', () => {
  it('keeps owner row actions disabled when the current user is an admin', async () => {
    const user = userEvent.setup();

    render(
      <MembersTable
        currentUser={{ id: 'admin-user' }}
        search=""
        onSearchChange={vi.fn()}
        onRemove={vi.fn()}
        onRoleChange={vi.fn()}
        canRemoveMembers
        canUpdateMembers
        members={[
          {
            id: 'owner-membership',
            role: 'owner',
            joinedAt: '2026-01-01T00:00:00.000Z',
            user: { id: 'owner-user', name: 'Owner User', email: 'owner@example.test' },
          },
        ]}
      />,
    );

    const ownerActions = screen.getByLabelText(/actions for owner user/i);

    await user.click(ownerActions);

    expect(ownerActions).toHaveAttribute('aria-disabled', 'true');
    expect(ownerActions.closest('details')).not.toHaveAttribute('open');
  });
});
