import { clsx } from 'clsx';

const variantClasses = {
  danger: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/70',
  gray: 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  info: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/70',
  primary: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:ring-cyan-900/70',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/70',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900/70',
};

const formatLabel = (value, fallback = '') => {
  const label = value || fallback;
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
};

export const Badge = ({ children, className, variant = 'gray' }) => (
  <span className={clsx('inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1', variantClasses[variant] || variantClasses.gray, className)}>
    {children}
  </span>
);

export const RoleBadge = ({ role = 'member' }) => {
  const roleVariant = {
    admin: 'info',
    member: 'gray',
    owner: 'primary',
  };

  return <Badge variant={roleVariant[role] || 'gray'}>{formatLabel(role, 'member')}</Badge>;
};

export const PlanBadge = ({ plan = 'free' }) => {
  if (plan === 'pro') {
    return (
      <Badge className="bg-gradient-to-r from-brand-600 to-cyan-500 text-white ring-brand-300 dark:from-cyan-400 dark:to-brand-500 dark:text-slate-950 dark:ring-cyan-700">
        Pro
      </Badge>
    );
  }

  return <Badge variant="gray">{formatLabel(plan, 'free')}</Badge>;
};
