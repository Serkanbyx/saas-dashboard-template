import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';

export const ConfirmModal = ({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  isConfirming = false,
  isOpen,
  message,
  onCancel,
  onConfirm,
  requireText = '',
  title,
}) => {
  const [confirmationText, setConfirmationText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  const isTextRequired = Boolean(requireText);
  const isConfirmDisabled = isConfirming || (isTextRequired && confirmationText !== requireText);

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm" title={title}>
      <div className="space-y-5">
        {message ? <p className="text-sm leading-6 text-gray-600 dark:text-slate-300">{message}</p> : null}
        {isTextRequired ? (
          <Input
            label={`Type "${requireText}" to continue`}
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            autoComplete="off"
          />
        ) : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isConfirmDisabled} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
