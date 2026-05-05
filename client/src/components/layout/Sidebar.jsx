import { Activity, BarChart3, Building2, CreditCard, LayoutDashboard, LogOut, Settings, Shield, Users, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../utils/permissions';
import { OrgSwitcher } from './OrgSwitcher';

const orgNavItems = [
  {
    label: 'Dashboard',
    to: '/app/dashboard',
    icon: LayoutDashboard,
    isVisible: () => true,
  },
  {
    label: 'Members',
    to: '/app/members',
    icon: Users,
    isVisible: ({ can }) => can('members.view'),
  },
  {
    label: 'Activity',
    to: '/app/activity',
    icon: Activity,
    isVisible: ({ can }) => can('activity.view'),
  },
  {
    label: 'Billing',
    to: '/app/billing',
    icon: CreditCard,
    isVisible: ({ can }) => can('billing.view'),
  },
  {
    label: 'Settings',
    to: '/app/settings',
    icon: Settings,
    isVisible: ({ can }) => can('settings.manage'),
  },
];

const adminNavItems = [
  {
    label: 'Dashboard',
    to: '/super-admin',
    icon: Shield,
    end: true,
  },
  {
    label: 'All Orgs',
    to: '/super-admin/orgs',
    icon: Building2,
  },
  {
    label: 'All Users',
    to: '/super-admin/users',
    icon: Users,
  },
];

const getUserInitials = (user) => {
  const fallbackName = user?.name || user?.email || 'User';

  return fallbackName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const getNavLinkClassName = ({ isActive }) =>
  [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-cyan-300'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
  ].join(' ');

const Brand = ({ variant }) => (
  <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-sm font-bold text-white shadow-lg shadow-brand-600/20">
      {variant === 'admin' ? 'SA' : 'SD'}
    </span>
    <span>
      <span className="block text-sm font-semibold text-gray-950 dark:text-slate-50">
        {variant === 'admin' ? 'Super Admin' : 'SaaS Dashboard'}
      </span>
      <span className="block text-xs text-gray-500 dark:text-slate-400">
        {variant === 'admin' ? 'Platform console' : 'Workspace'}
      </span>
    </span>
  </div>
);

const UserMenu = () => {
  const { user, logout } = useAuth() || {};
  const userName = user?.name || user?.email || 'Account';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 dark:bg-slate-800 dark:text-slate-200">
          {getUserInitials(user)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-gray-900 dark:text-slate-100">{userName}</span>
          <span className="block truncate text-xs text-gray-500 dark:text-slate-400">{user?.email || 'Signed in'}</span>
        </span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Logout
      </button>
    </div>
  );
};

const SidebarContent = ({ variant, onClose }) => {
  const permissions = usePermissions();
  const navItems = variant === 'admin' ? adminNavItems : orgNavItems.filter((item) => item.isVisible(permissions));

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <Brand variant={variant} />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {variant === 'org' ? <OrgSwitcher /> : null}

      <nav className="flex-1 space-y-1" aria-label={variant === 'admin' ? 'Super admin navigation' : 'Organization navigation'}>
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={getNavLinkClassName} onClick={onClose}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <UserMenu />
    </div>
  );
};

export const Sidebar = ({ variant = 'org', isMobileOpen = false, onClose }) => {
  const location = useLocation();

  useEffect(() => {
    onClose?.();
  }, [location.pathname, onClose]);

  return (
    <>
      <aside className="hidden w-60 flex-none border-r border-gray-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950 md:fixed md:inset-y-0 md:left-0 md:flex">
        <SidebarContent variant={variant} />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            onClick={onClose}
            aria-label="Close navigation backdrop"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white px-4 py-5 shadow-2xl dark:bg-slate-950">
            <SidebarContent variant={variant} onClose={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
};
