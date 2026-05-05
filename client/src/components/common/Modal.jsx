import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const Modal = ({ children, className, isOpen, onClose, size = 'md', title }) => {
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousActiveElementRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusableElements = [...(dialog?.querySelectorAll(focusableSelector) || [])];
    const firstFocusableElement = focusableElements[0];

    window.setTimeout(() => {
      (firstFocusableElement || dialog)?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="presentation">
      <button type="button" className="absolute inset-0 bg-slate-950/60" aria-label="Close modal" onClick={onClose} />
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={clsx(
          'relative max-h-[calc(100vh-3rem)] w-full overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl outline-none dark:border-slate-800 dark:bg-slate-900',
          sizeClasses[size] || sizeClasses.md,
          className,
        )}
      >
        {title ? (
          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
        {children}
      </section>
    </div>
  );
};
