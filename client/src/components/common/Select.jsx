import { forwardRef, useId } from 'react';
import { clsx } from 'clsx';

export const Select = forwardRef(function Select(
  { className, error, helperText, id, label, options = [], placeholder, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const descriptionId = error || helperText ? `${selectId}-description` : undefined;

  return (
    <div>
      {label ? (
        <label htmlFor={selectId} className="text-sm font-semibold text-gray-900 dark:text-slate-100">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={clsx(
          'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:focus:border-red-400 dark:focus:ring-red-950'
            : 'border-gray-200 focus:border-brand-500 focus:ring-brand-100 dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-950',
          className,
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error || helperText ? (
        <p id={descriptionId} className={clsx('mt-2 text-xs', error ? 'font-medium text-red-600 dark:text-red-300' : 'text-gray-500 dark:text-slate-400')}>
          {error || helperText}
        </p>
      ) : null}
    </div>
  );
});
