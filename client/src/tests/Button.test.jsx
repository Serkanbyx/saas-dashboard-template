import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../components/common/Button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Save</Button>);
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button disabled onClick={handleClick}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows a loading spinner and disables the button while loading', () => {
    render(
      <Button isLoading loadingLabel="Saving">
        Save
      </Button>,
    );

    expect(screen.getByRole('status', { name: /saving/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /savingsave/i })).toBeDisabled();
  });
});
