import { UserCircle } from 'lucide-react';
import { clsx } from 'clsx';

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const getInitials = (name = '') =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const Avatar = ({ className, name = 'User', size = 'md', src }) => {
  const sizeClassName = sizeClasses[size] || sizeClasses.md;
  const initials = getInitials(name);

  if (src) {
    return <img src={src} alt={`${name} avatar`} className={clsx('rounded-full object-cover', sizeClassName, className)} />;
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full bg-brand-50 font-bold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200',
        sizeClassName,
        className,
      )}
      aria-label={`${name} avatar`}
      role="img"
    >
      {initials || <UserCircle className="h-1/2 w-1/2" aria-hidden="true" />}
    </span>
  );
};
