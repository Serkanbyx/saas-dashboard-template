import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import * as activityService from '../services/activityService';
import * as billingService from '../services/billingService';
import * as membershipService from '../services/membershipService';
export { CreateOrgPage, LoginPage, RegisterPage } from './AuthPages';
export { AcceptInvitePage } from './invite/AcceptInvitePage';

const PageHeader = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
  </div>
);

const DashboardPlaceholder = ({ children, title, description }) => (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <PageHeader eyebrow="SaaS Dashboard" title={title} description={description} />
    {children}
  </section>
);

const ContextualNudge = ({ children }) => (
  <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-cyan-900/60 dark:bg-cyan-950/30 dark:text-cyan-100">
    {children}
  </div>
);

export const DashboardPage = () => (
  <DashboardPlaceholder title="Dashboard" description="Workspace analytics and activity summaries will appear here." />
);

export const MembersPage = () => {
  const { user } = useAuth() || {};
  const { currentMembership } = useOrg() || {};
  const [showInviteNudge, setShowInviteNudge] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadMembersOverview = async () => {
      if (!user?.hasCompletedOnboarding || !['owner', 'admin'].includes(currentMembership?.role)) {
        setShowInviteNudge(false);
        return;
      }

      try {
        const response = await membershipService.getMembersOverview();
        const counts = response.data?.data?.counts;

        if (isMounted) {
          setShowInviteNudge(counts?.total === 1 && counts?.owners === 1 && counts?.pending === 0);
        }
      } catch (_error) {
        if (isMounted) {
          setShowInviteNudge(false);
        }
      }
    };

    loadMembersOverview();

    return () => {
      isMounted = false;
    };
  }, [currentMembership?.role, user?.hasCompletedOnboarding]);

  return (
    <DashboardPlaceholder title="Members" description="Member management, invitations, and role controls will appear here.">
      {showInviteNudge ? (
        <ContextualNudge>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Invite your first teammate to start collaborating in this workspace.</span>
            <Link className="font-semibold text-brand-700 hover:text-brand-800 dark:text-cyan-200" to="/app/members?invite=true">
              Invite your first teammate
            </Link>
          </div>
        </ContextualNudge>
      ) : null}
    </DashboardPlaceholder>
  );
};

export const ActivityPage = () => {
  const { user } = useAuth() || {};
  const [showEmptyNudge, setShowEmptyNudge] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadActivityPreview = async () => {
      if (!user?.hasCompletedOnboarding) {
        setShowEmptyNudge(false);
        return;
      }

      try {
        const response = await activityService.listActivity({ limit: 1 });
        const total = response.data?.data?.pagination?.total;

        if (isMounted) {
          setShowEmptyNudge(total === 0);
        }
      } catch (_error) {
        if (isMounted) {
          setShowEmptyNudge(false);
        }
      }
    };

    loadActivityPreview();

    return () => {
      isMounted = false;
    };
  }, [user?.hasCompletedOnboarding]);

  return (
    <DashboardPlaceholder title="Activity" description="Organization activity logs and filters will appear here.">
      {showEmptyNudge ? <ContextualNudge>Activity will appear here as your team works.</ContextualNudge> : null}
    </DashboardPlaceholder>
  );
};

export const BillingPage = () => {
  const { user } = useAuth() || {};
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentPlan = async () => {
      if (!user?.hasCompletedOnboarding) {
        setShowUpgradeNudge(false);
        return;
      }

      try {
        const response = await billingService.getCurrentPlan();

        if (isMounted) {
          setShowUpgradeNudge(response.data?.data?.plan === 'free');
        }
      } catch (_error) {
        if (isMounted) {
          setShowUpgradeNudge(false);
        }
      }
    };

    loadCurrentPlan();

    return () => {
      isMounted = false;
    };
  }, [user?.hasCompletedOnboarding]);

  return (
    <DashboardPlaceholder title="Billing" description="Plan details, billing history, and upgrade controls will appear here.">
      {showUpgradeNudge ? <ContextualNudge>Upgrade to Pro for advanced features.</ContextualNudge> : null}
    </DashboardPlaceholder>
  );
};

export const OrgSettingsPage = () => (
  <DashboardPlaceholder title="Organization settings" description="Workspace profile and organization preferences will appear here." />
);

export const AccountSettingsPage = () => (
  <DashboardPlaceholder title="Account settings" description="Profile, avatar, and password settings will appear here." />
);

export const SuperAdminDashboardPage = () => (
  <DashboardPlaceholder title="Super admin dashboard" description="Platform-wide stats and operational signals will appear here." />
);

export const AllOrgsPage = () => (
  <DashboardPlaceholder title="All organizations" description="Super admins will review and manage organizations here." />
);

export const AllUsersPage = () => (
  <DashboardPlaceholder title="All users" description="Super admins will review and manage platform users here." />
);

export const ForbiddenPage = () => (
  <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
    <PageHeader
      eyebrow="403"
      title="You do not have access"
      description="Your current role does not include permission to view this page."
    />
    <Link
      to="/app/dashboard"
      className="mt-6 inline-flex rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-amber-50 dark:focus:ring-offset-slate-950"
    >
      Back to dashboard
    </Link>
  </section>
);

export const NotFoundPage = () => (
  <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <section className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="The page you are looking for does not exist or may have moved."
      />
      <Link
        to="/app/dashboard"
        className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
      >
        Go to dashboard
      </Link>
    </section>
  </main>
);
