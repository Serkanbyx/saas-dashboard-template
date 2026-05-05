import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
};

const colorClasses = {
  brand: 'text-brand-600 dark:text-cyan-300',
  current: 'text-current',
  gray: 'text-gray-500 dark:text-slate-400',
  white: 'text-white',
};

export const Spinner = ({ className, color = 'brand', label = 'Loading', size = 'md' }) => (
  <span className={clsx('inline-flex items-center justify-center', className)} role="status" aria-label={label}>
    <Loader2 className={clsx('animate-spin', sizeClasses[size] || sizeClasses.md, colorClasses[color] || colorClasses.brand)} aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </span>
);
