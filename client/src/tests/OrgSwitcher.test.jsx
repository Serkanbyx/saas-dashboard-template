import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrgSwitcher } from '../components/layout/OrgSwitcher';
import { useOrg } from '../hooks/useOrg';

vi.mock('../hooks/useOrg', () => ({
  useOrg: vi.fn(),
}));

describe('OrgSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls switchOrg when an organization is selected', async () => {
    const user = userEvent.setup();
    const switchOrg = vi.fn();

    useOrg.mockReturnValue({
      activeOrg: { id: 'org-1', name: 'Acme', role: 'owner' },
      isSwitchingOrg: false,
      orgs: [
        { id: 'org-1', name: 'Acme', role: 'owner' },
        { id: 'org-2', name: 'Globex', role: 'admin' },
      ],
      switchOrg,
    });

    render(
      <MemoryRouter>
        <OrgSwitcher />
      </MemoryRouter>,
    );

    await user.click(screen.getByText('Acme').closest('button'));
    await user.click(screen.getByText('Globex').closest('button'));

    expect(switchOrg).toHaveBeenCalledWith('org-2');
  });
});
