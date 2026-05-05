import { Link } from 'react-router-dom';
export { CreateOrgPage, LoginPage, RegisterPage } from './AuthPages';

const PageHeader = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{title}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
  </div>
);

const DashboardPlaceholder = ({ title, description }) => (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <PageHeader eyebrow="SaaS Dashboard" title={title} description={description} />
  </section>
);

const AuthPlaceholder = ({ title, description, linkLabel, linkTo }) => (
  <div>
    <PageHeader eyebrow="Account" title={title} description={description} />
    {linkTo ? (
      <Link
        to={linkTo}
        className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
      >
        {linkLabel}
      </Link>
    ) : null}
  </div>
);

export const AcceptInvitePage = () => (
  <AuthPlaceholder
    title="Accept invitation"
    description="Invitation acceptance will be implemented with the invitation flow."
    linkLabel="Go to login"
    linkTo="/login"
  />
);

export const DashboardPage = () => (
  <DashboardPlaceholder title="Dashboard" description="Workspace analytics and activity summaries will appear here." />
);

export const MembersPage = () => (
  <DashboardPlaceholder title="Members" description="Member management, invitations, and role controls will appear here." />
);

export const ActivityPage = () => (
  <DashboardPlaceholder title="Activity" description="Organization activity logs and filters will appear here." />
);

export const BillingPage = () => (
  <DashboardPlaceholder title="Billing" description="Plan details, billing history, and upgrade controls will appear here." />
);

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
