import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import { ForbiddenPage } from '../pages/error/ForbiddenPage';

const getNextRedirect = (location) => {
  const nextPath = `${location.pathname}${location.search}${location.hash}`;

  return `/login?next=${encodeURIComponent(nextPath)}`;
};

export const RouteLoader = ({ label = 'Loading' }) => (
  <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <section className="text-center" aria-live="polite" aria-busy="true">
      <Spinner className="mx-auto" label={label} size="xl" />
      <p className="mt-4 text-sm font-medium text-gray-600 dark:text-slate-300">{label}...</p>
    </section>
  </main>
);

export const ProtectedRoute = ({ requireOrg = false }) => {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth() || {};
  const { orgs = [], activeOrg, loading: orgLoading, setActiveOrgFirstAvailable } = useOrg() || {};

  useEffect(() => {
    if (!requireOrg || authLoading || orgLoading || activeOrg || orgs.length === 0) {
      return;
    }

    setActiveOrgFirstAvailable?.();
  }, [activeOrg, authLoading, orgLoading, orgs.length, requireOrg, setActiveOrgFirstAvailable]);

  if (authLoading) {
    return <RouteLoader label="Checking your session" />;
  }

  if (!user) {
    return <Navigate to={getNextRedirect(location)} replace />;
  }

  if (!requireOrg) {
    return <Outlet />;
  }

  if (orgLoading) {
    return <RouteLoader label="Loading your workspace" />;
  }

  if (orgs.length === 0) {
    return <Navigate to="/create-org" replace />;
  }

  if (!activeOrg) {
    return <RouteLoader label="Preparing your workspace" />;
  }

  return <Outlet />;
};

export const GuestOnlyRoute = () => {
  const { user, loading } = useAuth() || {};

  if (loading) {
    return <RouteLoader label="Checking your session" />;
  }

  return user ? <Navigate to="/app/dashboard" replace /> : <Outlet />;
};

export const OrgRoleRoute = ({ roles = [], children }) => {
  const { currentMembership } = useOrg() || {};

  if (!roles.includes(currentMembership?.role)) {
    return <ForbiddenPage />;
  }

  return children;
};

export const SuperAdminRoute = () => {
  const location = useLocation();
  const { user, loading } = useAuth() || {};

  if (loading) {
    return <RouteLoader label="Checking your session" />;
  }

  if (!user) {
    return <Navigate to={getNextRedirect(location)} replace />;
  }

  if (user.platformRole !== 'superadmin') {
    return <ForbiddenPage />;
  }

  return <Outlet />;
};
