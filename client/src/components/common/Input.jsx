import { forwardRef, useId } from 'react';
import { clsx } from 'clsx';

export const Input = forwardRef(function Input(
  { className, error, helperText, icon: Icon, id, label, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = error || helperText ? `${inputId}-description` : undefined;

  return (
    <div>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-semibold text-gray-900 dark:text-slate-100">
          {label}
        </label>
      ) : null}
      <div className="relative mt-2">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          className={clsx(
            'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900',
            Icon ? 'pl-10' : '',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-400 dark:focus:ring-red-950'
              : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100 dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-950',
            className,
          )}
          {...props}
        />
      </div>
      {error || helperText ? (
        <p id={descriptionId} className={clsx('mt-2 text-xs', error ? 'font-medium text-red-600 dark:text-red-300' : 'text-gray-500 dark:text-slate-400')}>
          {error || helperText}
        </p>
      ) : null}
    </div>
  );
});
