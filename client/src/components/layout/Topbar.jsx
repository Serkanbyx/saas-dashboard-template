import { ChevronDown, LogOut, Menu, Search, UserCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationBell } from './NotificationBell';

const titleByPathSegment = {
  account: 'Account Settings',
  activity: 'Activity',
  billing: 'Billing',
  dashboard: 'Dashboard',
  members: 'Members',
  notifications: 'Notifications',
  orgs: 'All Orgs',
  settings: 'Settings',
  users: 'All Users',
};

const getPageTitle = (pathname) => {
  if (pathname === '/super-admin') {
    return 'Super Admin Dashboard';
  }

  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments.at(-1);

  return titleByPathSegment[lastSegment] || 'Dashboard';
};

const getUserInitials = (user) => {
  const fallbackName = user?.name || user?.email || 'User';

  return fallbackName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const Topbar = ({ onMenuClick, pageTitle }) => {
  const location = useLocation();
  const { user, logout } = useAuth() || {};
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const resolvedPageTitle = useMemo(() => pageTitle || getPageTitle(location.pathname), [location.pathname, pageTitle]);

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('command-palette:open'));
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Workspace</p>
            <h1 className="truncate text-xl font-semibold tracking-tight text-gray-950 dark:text-slate-50 sm:text-2xl">
              {resolvedPageTitle}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="hidden items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-500 sm:inline-flex"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
            <kbd className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
              ⌘K
            </kbd>
          </button>

          <NotificationBell />
          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                {getUserInitials(user)}
              </span>
              <ChevronDown className="hidden h-4 w-4 sm:block" aria-hidden="true" />
            </button>

            {isUserMenuOpen ? (
              <div
                className="absolute right-0 z-30 mt-3 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
                role="menu"
              >
                <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-800">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {user?.name || user?.email || 'Account'}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-slate-400">{user?.email || 'Signed in'}</p>
                </div>
                <Link
                  to="/app/account"
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                  role="menuitem"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <UserCircle className="h-4 w-4" aria-hidden="true" />
                  Account Settings
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
