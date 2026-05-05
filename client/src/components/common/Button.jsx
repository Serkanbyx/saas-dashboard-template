import { clsx } from 'clsx';
import { Spinner } from './Spinner';

const variantClasses = {
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:focus:ring-offset-slate-900',
  ghost:
    'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400',
  secondary:
    'border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
};

const sizeClasses = {
  sm: 'rounded-lg px-3 py-2 text-xs',
  md: 'rounded-xl px-4 py-2.5 text-sm',
  lg: 'rounded-2xl px-5 py-3 text-sm',
};

export const Button = ({
  children,
  className,
  disabled = false,
  icon: Icon,
  isLoading = false,
  loadingLabel = 'Loading',
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    className={clsx(
      'inline-flex items-center justify-center gap-2 font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900',
      variantClasses[variant] || variantClasses.primary,
      sizeClasses[size] || sizeClasses.md,
      className,
    )}
    {...props}
  >
    {isLoading ? <Spinner color="current" label={loadingLabel} size="sm" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
    {children}
  </button>
);
