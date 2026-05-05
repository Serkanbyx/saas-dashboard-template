import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RoleBadge } from '../components/common/Badge';

describe('RoleBadge', () => {
  it.each([
    ['owner', 'Owner', 'text-brand-700'],
    ['admin', 'Admin', 'text-blue-700'],
    ['member', 'Member', 'text-gray-700'],
  ])('renders the %s role with its expected color class', (role, label, colorClass) => {
    render(<RoleBadge role={role} />);

    expect(screen.getByText(label)).toHaveClass(colorClass);
  });
});
