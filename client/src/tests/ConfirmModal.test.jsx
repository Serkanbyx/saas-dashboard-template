import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '../components/common/ConfirmModal';

describe('ConfirmModal', () => {
  it('requires matching text before confirming', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen
        title="Delete organization"
        message="This action cannot be undone."
        requireText="DELETE"
        onCancel={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText(/type "delete" to continue/i), 'WRONG');
    expect(confirmButton).toBeDisabled();

    await user.clear(screen.getByLabelText(/type "delete" to continue/i));
    await user.type(screen.getByLabelText(/type "delete" to continue/i), 'DELETE');
    await user.click(confirmButton);

    expect(handleConfirm).toHaveBeenCalledOnce();
  });
});
