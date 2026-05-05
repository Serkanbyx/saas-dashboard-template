import { Link, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Activity as ActivityIcon, DollarSign, TrendingUp, UserPlus, Users } from 'lucide-react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useOrg } from '../hooks/useOrg';
import * as dashboardService from '../services/dashboardService';
import { formatActivity } from '../utils/activityFormatter';
export { CreateOrgPage, LoginPage, RegisterPage } from './AuthPages';
export { ActivityPage } from './activity/ActivityPage';
export { BillingPage } from './billing/BillingPage';
export { AcceptInvitePage } from './invite/AcceptInvitePage';
export { MembersPage } from './members/MembersPage';
export { AccountSettingsPage } from './settings/AccountSettingsPage';
export { OrgSettingsPage } from './settings/OrgSettingsPage';
export { AllOrgsPage, AllUsersPage, SuperAdminDashboardPage } from './super-admin/SuperAdminPages';

const ActiveUsersChart = lazy(() => import('../components/dashboard/ActiveUsersChart'));
const GrowthChart = lazy(() => import('../components/dashboard/GrowthChart'));
const RevenueChart = lazy(() => import('../components/dashboard/RevenueChart'));

const PageHeader = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
  </div>
);

const getOrgId = (org) => org?._id || org?.id;

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat(undefined, {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
});

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatPlan = (plan) => {
  if (!plan) {
    return 'Free';
  }

  return plan.charAt(0).toUpperCase() + plan.slice(1);
};

const KpiCard = ({ icon: Icon, label, value, trend, isMock }) => (
  <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
          {isMock ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              Sample
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{value}</p>
      </div>
      <span className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
    {trend ? <p className="mt-4 text-sm font-medium text-gray-500 dark:text-slate-400">{trend}</p> : null}
  </article>
);

const KpiCardSkeleton = () => (
  <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-28 rounded-full bg-gray-200 dark:bg-slate-800" />
      <div className="h-9 w-20 rounded-full bg-gray-200 dark:bg-slate-800" />
      <div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-slate-800" />
    </div>
  </div>
);

const ChartPanel = ({ children, description, isMock, title }) => (
  <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-950 dark:text-slate-50">{title}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p>
      </div>
      {isMock ? (
        <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Sample
        </span>
      ) : null}
    </div>
    {children}
  </section>
);

const ChartFallback = () => (
  <div className="h-[300px] animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" aria-hidden="true" />
);

const ChartErrorFallback = () => (
  <div
    className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-red-200 px-6 text-center text-sm text-red-600 dark:border-red-900/70 dark:text-red-200"
    role="alert"
  >
    This chart is temporarily unavailable.
  </div>
);

const RecentActivity = ({ activities = [] }) => (
  <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <div>
      <h3 className="text-base font-semibold text-gray-950 dark:text-slate-50">Recent activity</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Latest real workspace events.</p>
    </div>

    <div className="mt-5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
      {activities.length > 0 ? (
        <ul className="space-y-3">
          {activities.slice(0, 10).map((activity) => (
            <li
              key={activity._id || activity.id}
              className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{formatActivity(activity)}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{formatDateTime(activity.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
          No activity yet.
        </p>
      )}
    </div>
  </section>
);

export const DashboardPage = () => {
  const { user } = useAuth() || {};
  const { activeOrg } = useOrg() || {};
  const activeOrgId = getOrgId(activeOrg);
  const [overview, setOverview] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      if (!activeOrgId) {
        setOverview(null);
        setIsLoadingOverview(false);
        return;
      }

      setIsLoadingOverview(true);
      setOverviewError('');

      try {
        const response = await dashboardService.getOverview();
        if (isMounted) {
          setOverview(response.data?.data || null);
        }
      } catch (_error) {
        if (isMounted) {
          setOverviewError('Dashboard overview could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingOverview(false);
        }
      }
    };

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [activeOrgId]);

  const kpis = overview?.kpis || {};
  const plan = kpis.currentPlan || activeOrg?.plan;
  const recentActivity = overview?.recentActivity || [];

  return (
    <div className="grid grid-cols-12 gap-6">
      <section className="col-span-12 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">
              {activeOrg?.name || 'Workspace'}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">
              {getGreeting()}, {user?.name || 'there'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
              Track team health, revenue signals, and recent activity for your active organization.
            </p>
          </div>
          <span className="w-fit rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200">
            {formatPlan(plan)} plan
          </span>
        </div>
      </section>

      {overviewError ? (
        <div className="col-span-12 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {overviewError}
        </div>
      ) : null}

      <section className="col-span-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Workspace KPIs">
        {isLoadingOverview ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              icon={Users}
              label="Total Members"
              value={numberFormatter.format(kpis.totalMembers || 0)}
              trend={`${numberFormatter.format(overview?.seats?.used || 0)} of ${numberFormatter.format(
                overview?.seats?.limit || 0,
              )} seats used`}
            />
            <KpiCard
              icon={UserPlus}
              label="Pending Invitations"
              value={numberFormatter.format(kpis.pendingInvitations || 0)}
              trend="Open invitations"
            />
            <KpiCard
              icon={ActivityIcon}
              label="Activities (7d)"
              value={numberFormatter.format(kpis.activitiesLast7d || 0)}
              trend={`${numberFormatter.format(kpis.activeUsersToday || 0)} active users today`}
            />
            <KpiCard
              icon={DollarSign}
              label="Monthly Revenue"
              value={currencyFormatter.format(kpis.monthlyRevenue || 0)}
              trend={`${numberFormatter.format(kpis.growthRate || 0)}% user growth`}
              isMock={overview?.mock?.revenue}
            />
          </>
        )}
      </section>

      <div className="col-span-12 grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Active users trend" description="Mock 30-day member growth signal." isMock>
          <ErrorBoundary fallback={<ChartErrorFallback />}>
            <Suspense fallback={<ChartFallback />}>
              <GrowthChart activeOrgId={activeOrgId} />
            </Suspense>
          </ErrorBoundary>
        </ChartPanel>

        <ChartPanel title="Revenue per day" description="Mock daily revenue signal." isMock>
          <ErrorBoundary fallback={<ChartErrorFallback />}>
            <Suspense fallback={<ChartFallback />}>
              <RevenueChart activeOrgId={activeOrgId} />
            </Suspense>
          </ErrorBoundary>
        </ChartPanel>
      </div>

      <div className="col-span-12">
        <ChartPanel title="Activity events" description="Real activity events per day over the last 30 days.">
          <ErrorBoundary fallback={<ChartErrorFallback />}>
            <Suspense fallback={<ChartFallback />}>
              <ActiveUsersChart activeOrgId={activeOrgId} />
            </Suspense>
          </ErrorBoundary>
        </ChartPanel>
      </div>

      <div className="col-span-12">
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
};

export const ForbiddenPage = () => (
  <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
    <PageHeader
      eyebrow="403"
      title="You don't have permission"
      description="Your current organization role does not include permission to view this page."
    />
    <Link
      to="/app/dashboard"
      className="mt-6 inline-flex rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-amber-50 dark:focus:ring-offset-slate-950"
    >
      Back to dashboard
    </Link>
  </section>
);

export const NotFoundPage = () => {
  const { user } = useAuth() || {};
  const location = useLocation();
  const nextPath = `${location.pathname}${location.search}${location.hash}`;
  const actionPath = user ? '/app/dashboard' : `/login?next=${encodeURIComponent(nextPath)}`;
  const actionLabel = user ? 'Go to Dashboard' : 'Login';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-4xl bg-brand-50 text-5xl font-black text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-200">
          404
        </div>
        <PageHeader
          eyebrow="Not found"
          title="We can't find what you're looking for."
          description="The page may have moved, been deleted, or you may need to sign in before opening it."
        />
        <Link
          to={actionPath}
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
        >
          {actionLabel}
        </Link>
      </section>
    </main>
  );
};
