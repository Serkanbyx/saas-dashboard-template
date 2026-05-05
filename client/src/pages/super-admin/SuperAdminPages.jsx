import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  CheckCircle2,
  Crown,
  Eye,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as superAdminService from '../../services/superAdminService';
import { formatActivity } from '../../utils/activityFormatter';
import { useAuth } from '../../hooks/useAuth';

const planColors = {
  free: 'var(--color-slate-400)',
  pro: 'var(--color-brand-600)',
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const formatDate = (value) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));
};

const formatDateTime = (value) => {
  if (!value) return '-';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatChartDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));

const formatPlan = (plan) => (plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Free');

const getErrorMessage = (error, fallbackMessage) => error?.response?.data?.message || fallbackMessage;

const getId = (item) => item?._id || item?.id;

const PageHeader = ({ eyebrow, title, description }) => (
  <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{title}</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-slate-300">{description}</p>
  </section>
);

const StatusBadge = ({ tone = 'gray', children }) => {
  const toneClassNames = {
    amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/70',
    emerald:
      'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/70',
    gray: 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
    red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/70',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/70',
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClassNames[tone]}`}>
      {children}
    </span>
  );
};

const Panel = ({ title, description, children }) => (
  <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <div className="mb-5">
      <h3 className="text-base font-semibold text-gray-950 dark:text-slate-50">{title}</h3>
      {description ? <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{description}</p> : null}
    </div>
    {children}
  </section>
);

const KpiCard = ({ icon: Icon, label, value, description }) => (
  <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{value}</p>
      </div>
      <span className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
    {description ? <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">{description}</p> : null}
  </article>
);

const LoadingPanel = ({ label = 'Loading data' }) => (
  <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
    {label}...
  </div>
);

const EmptyState = ({ children }) => (
  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
    {children}
  </div>
);

const FilterBar = ({ search, onSearchChange, children }) => (
  <div className="flex flex-col gap-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
    <label className="relative flex-1">
      <span className="sr-only">Search</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        placeholder="Search by name, slug or email"
        type="search"
      />
    </label>
    {children}
  </div>
);

const SelectFilter = ({ label, value, onChange, children }) => (
  <label className="flex min-w-40 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium normal-case text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
    >
      {children}
    </select>
  </label>
);

const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-sm dark:border-slate-800">
      <p className="text-gray-500 dark:text-slate-400">
        Page {pagination.page} of {pagination.totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="rounded-xl border border-gray-200 px-3 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const ActionButton = ({ children, tone = 'gray', ...props }) => {
  const toneClassNames = {
    gray: 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
    green:
      'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/70 dark:text-emerald-200 dark:hover:bg-emerald-950/40',
    red: 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/70 dark:text-red-200 dark:hover:bg-red-950/40',
    sky: 'border-sky-200 text-sky-700 hover:bg-sky-50 dark:border-sky-900/70 dark:text-sky-200 dark:hover:bg-sky-950/40',
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClassNames[tone]}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const SuperAdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await superAdminService.getPlatformStats();
        if (isMounted) {
          setStats(response.data?.data || null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, 'Platform stats could not be loaded.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const planData = useMemo(
    () =>
      Object.entries(stats?.planBreakdown || {}).map(([plan, value]) => ({
        name: formatPlan(plan),
        plan,
        value,
      })),
    [stats],
  );

  if (isLoading) {
    return <LoadingPanel label="Loading platform stats" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Platform overview"
        description="Monitor real platform usage, subscriptions, signups and cross-organization activity."
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform KPIs">
        <KpiCard icon={Users} label="Total Users" value={numberFormatter.format(stats?.totalUsers || 0)} description="All registered accounts" />
        <KpiCard icon={Building2} label="Total Orgs" value={numberFormatter.format(stats?.totalOrgs || 0)} description="Created workspaces" />
        <KpiCard
          icon={Crown}
          label="Active Subscriptions"
          value={numberFormatter.format(stats?.activeSubscriptions || 0)}
          description="Active Pro organizations"
        />
        <KpiCard
          icon={UserCheck}
          label="Signups (30d)"
          value={numberFormatter.format(stats?.signupsLast30d || 0)}
          description={`${numberFormatter.format(stats?.activityLast24h || 0)} activities in 24h`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Signup trend" description="Real daily user signups for the last 30 days.">
          {stats?.signupTrend?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.signupTrend} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-slate-200)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatChartDate} tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} width={36} />
                <Tooltip labelFormatter={formatChartDate} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Signups"
                  stroke="var(--color-brand-600)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState>No signup data available yet.</EmptyState>
          )}
        </Panel>

        <Panel title="Org distribution by plan" description="Real active organization split by billing plan.">
          {planData.some((item) => item.value > 0) ? (
            <div className="grid gap-4 sm:grid-cols-[1fr_10rem] sm:items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={planData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={105} paddingAngle={4}>
                    {planData.map((entry) => (
                      <Cell key={entry.plan} fill={planColors[entry.plan] || 'var(--color-slate-500)'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => numberFormatter.format(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {planData.map((item) => (
                  <div key={item.plan} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: planColors[item.plan] }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-gray-950 dark:text-slate-50">{numberFormatter.format(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>No organizations available yet.</EmptyState>
          )}
        </Panel>
      </section>

      <Panel title="Recent platform activity" description="Latest cross-organization operational events.">
        {stats?.recentActivity?.length ? (
          <ul className="space-y-3">
            {stats.recentActivity.map((activityLog) => (
              <li
                key={getId(activityLog)}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{formatActivity(activityLog)}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {activityLog.orgId?.name || 'Platform-wide'} · {formatDateTime(activityLog.createdAt)}
                    </p>
                  </div>
                  <StatusBadge tone="sky">{activityLog.action}</StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>No platform activity yet.</EmptyState>
        )}
      </Panel>
    </div>
  );
};

export const AllOrgsPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = {
        limit: 20,
        page,
        plan: plan || undefined,
        search: search || undefined,
        isDeleted: status === '' ? undefined : status === 'suspended',
      };
      const response = await superAdminService.listAllOrgs(params);
      const data = response.data?.data || {};
      setOrganizations(data.organizations || []);
      setPagination(data.pagination || null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Organizations could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, plan, search, status]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    setPage(1);
  }, [plan, search, status]);

  const loadOrgDetails = async (organization) => {
    const orgId = getId(organization);
    setSelectedOrg(organization);
    setOrgDetails(null);
    setDetailsLoading(true);

    try {
      const response = await superAdminService.getOrgDetails(orgId);
      setOrgDetails(response.data?.data || null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Organization details could not be loaded.'));
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSuspend = async (organization) => {
    const reason = window.prompt(`Why should ${organization.name} be suspended?`);
    if (!reason?.trim()) return;

    const confirmed = window.confirm(`Suspend ${organization.name}? Users will lose access until it is restored.`);
    if (!confirmed) return;

    try {
      await superAdminService.suspendOrg(getId(organization), { reason: reason.trim() });
      toast.success(`${organization.name} suspended`);
      await loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Organization could not be suspended.'));
    }
  };

  const handleRestore = async (organization) => {
    const confirmed = window.confirm(`Restore ${organization.name}?`);
    if (!confirmed) return;

    try {
      await superAdminService.restoreOrg(getId(organization));
      toast.success(`${organization.name} restored`);
      await loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Organization could not be restored.'));
    }
  };

  const handleForceDelete = async (organization) => {
    const firstConfirm = window.confirm(`Permanently delete ${organization.name}? This action cannot be undone.`);
    if (!firstConfirm) return;

    const confirmName = window.prompt(`Type "${organization.name}" to confirm permanent deletion.`);
    if (confirmName !== organization.name) {
      toast.error('Organization name confirmation did not match.');
      return;
    }

    try {
      await superAdminService.forceDeleteOrg(getId(organization), { confirmName });
      toast.success(`${organization.name} permanently deleted`);
      setSelectedOrg(null);
      setOrgDetails(null);
      await loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Organization could not be deleted.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="All organizations"
        description="Search, filter and manage every organization on the platform with explicit confirmation for destructive actions."
      />

      <FilterBar search={search} onSearchChange={setSearch}>
        <SelectFilter label="Plan" value={plan} onChange={setPlan}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </SelectFilter>
        <SelectFilter label="Status" value={status} onChange={setStatus}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </SelectFilter>
      </FilterBar>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm dark:divide-slate-800">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Slug</th>
                <th className="px-5 py-3 font-semibold">Plan</th>
                <th className="px-5 py-3 font-semibold">Members</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {organizations.map((organization) => (
                <tr key={getId(organization)} className="align-top">
                  <td className="px-5 py-4 font-semibold text-gray-950 dark:text-slate-50">{organization.name}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{organization.slug}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={organization.plan === 'pro' ? 'sky' : 'gray'}>{formatPlan(organization.plan)}</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{numberFormatter.format(organization.memberCount || 0)}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-slate-300">
                    <span className="block font-medium text-gray-900 dark:text-slate-100">{organization.ownerId?.name || 'Unknown owner'}</span>
                    <span className="block text-xs">{organization.ownerId?.email}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{formatDate(organization.createdAt)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone={organization.isDeleted ? 'red' : 'emerald'}>{organization.isDeleted ? 'Suspended' : 'Active'}</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton onClick={() => loadOrgDetails(organization)} tone="sky">
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Details
                      </ActionButton>
                      {organization.isDeleted ? (
                        <ActionButton onClick={() => handleRestore(organization)} tone="green">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Restore
                        </ActionButton>
                      ) : (
                        <ActionButton onClick={() => handleSuspend(organization)} tone="red">
                          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                          Suspend
                        </ActionButton>
                      )}
                      <ActionButton onClick={() => handleForceDelete(organization)} tone="red">
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Force Delete
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isLoading ? <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-slate-400">Loading organizations...</div> : null}
        {!isLoading && organizations.length === 0 ? <div className="p-5"><EmptyState>No organizations match your filters.</EmptyState></div> : null}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </section>

      {selectedOrg ? (
        <Panel title={`${selectedOrg.name} details`} description="Members, recent activity and billing context for the selected organization.">
          {detailsLoading ? (
            <LoadingPanel label="Loading organization details" />
          ) : orgDetails ? (
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-3 rounded-2xl bg-gray-50 p-4 dark:bg-slate-950">
                <p className="text-sm font-semibold text-gray-950 dark:text-slate-50">Members</p>
                <p className="text-2xl font-semibold text-gray-950 dark:text-slate-50">{numberFormatter.format(orgDetails.members?.length || 0)}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Current membership records</p>
              </div>
              <div className="space-y-3 rounded-2xl bg-gray-50 p-4 dark:bg-slate-950">
                <p className="text-sm font-semibold text-gray-950 dark:text-slate-50">Latest billing</p>
                <p className="text-2xl font-semibold text-gray-950 dark:text-slate-50">{formatPlan(orgDetails.organization?.plan)}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {orgDetails.billing?.latestRecord ? formatDate(orgDetails.billing.latestRecord.createdAt) : 'No records yet'}
                </p>
              </div>
              <div className="space-y-3 rounded-2xl bg-gray-50 p-4 dark:bg-slate-950">
                <p className="text-sm font-semibold text-gray-950 dark:text-slate-50">Recent activity</p>
                <p className="text-2xl font-semibold text-gray-950 dark:text-slate-50">{numberFormatter.format(orgDetails.recentActivity?.length || 0)}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">Latest events loaded</p>
              </div>
            </div>
          ) : (
            <EmptyState>Select an organization to view details.</EmptyState>
          )}
        </Panel>
      ) : null}
    </div>
  );
};

export const AllUsersPage = () => {
  const { user: currentUser } = useAuth() || {};
  const [usersList, setUsersList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [activeSuperAdminCount, setActiveSuperAdminCount] = useState(0);
  const [search, setSearch] = useState('');
  const [platformRole, setPlatformRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMembershipUser, setSelectedMembershipUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = {
        limit: 20,
        page,
        platformRole: platformRole || undefined,
        search: search || undefined,
        isActive: isActive === '' ? undefined : isActive,
      };
      const response = await superAdminService.listAllUsers(params);
      const data = response.data?.data || {};
      setUsersList(data.users || []);
      setPagination(data.pagination || null);
      setActiveSuperAdminCount(data.activeSuperAdminCount || 0);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Users could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, [isActive, page, platformRole, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [isActive, platformRole, search]);

  const viewMemberships = async (selectedUser) => {
    setSelectedMembershipUser(selectedUser);
    setMemberships([]);
    setMembershipsLoading(true);

    try {
      const response = await superAdminService.getUserMemberships(getId(selectedUser));
      setMemberships(response.data?.data?.memberships || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Memberships could not be loaded.'));
    } finally {
      setMembershipsLoading(false);
    }
  };

  const updateUser = async ({ selectedUser, updates, successMessage }) => {
    try {
      await superAdminService.updateUserStatus(getId(selectedUser), updates);
      toast.success(successMessage);
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error, 'User could not be updated.'));
    }
  };

  const handleToggleActive = (selectedUser) => {
    const nextActive = !selectedUser.isActive;
    const confirmed = window.confirm(`${nextActive ? 'Activate' : 'Deactivate'} ${selectedUser.email}?`);
    if (!confirmed) return;

    updateUser({
      selectedUser,
      updates: { isActive: nextActive },
      successMessage: `${selectedUser.email} ${nextActive ? 'activated' : 'deactivated'}`,
    });
  };

  const handleRoleChange = (selectedUser) => {
    const nextRole = selectedUser.platformRole === 'superadmin' ? 'user' : 'superadmin';
    const confirmed = window.confirm(`${nextRole === 'superadmin' ? 'Promote' : 'Demote'} ${selectedUser.email}?`);
    if (!confirmed) return;

    updateUser({
      selectedUser,
      updates: { platformRole: nextRole },
      successMessage: `${selectedUser.email} ${nextRole === 'superadmin' ? 'promoted' : 'demoted'}`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="All users"
        description="Manage account access, platform roles and organization memberships with self-action protections."
      />

      <FilterBar search={search} onSearchChange={setSearch}>
        <SelectFilter label="Role" value={platformRole} onChange={setPlatformRole}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="superadmin">Super Admin</option>
        </SelectFilter>
        <SelectFilter label="Active" value={isActive} onChange={setIsActive}>
          <option value="">All users</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </SelectFilter>
      </FilterBar>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm dark:divide-slate-800">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Platform Role</th>
                <th className="px-5 py-3 font-semibold">Active</th>
                <th className="px-5 py-3 font-semibold">Orgs Count</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {usersList.map((selectedUser) => {
                const isSelf = getId(selectedUser) === getId(currentUser);
                const isLastSuperAdmin =
                  selectedUser.platformRole === 'superadmin' && selectedUser.isActive && activeSuperAdminCount <= 1;
                const roleActionDisabled = isSelf || isLastSuperAdmin;
                const activeActionDisabled = isSelf || isLastSuperAdmin;

                return (
                  <tr key={getId(selectedUser)} className="align-top">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {selectedUser.avatar ? (
                          <img src={selectedUser.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700 dark:bg-slate-800 dark:text-slate-200">
                            {(selectedUser.name || selectedUser.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="font-semibold text-gray-950 dark:text-slate-50">{selectedUser.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{selectedUser.email}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={selectedUser.platformRole === 'superadmin' ? 'sky' : 'gray'}>
                        {selectedUser.platformRole === 'superadmin' ? 'Super Admin' : 'User'}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={selectedUser.isActive ? 'emerald' : 'red'}>{selectedUser.isActive ? 'Active' : 'Inactive'}</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{numberFormatter.format(selectedUser.membershipCount || 0)}</td>
                    <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{formatDate(selectedUser.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton onClick={() => handleToggleActive(selectedUser)} disabled={activeActionDisabled} tone="gray" title={isSelf ? 'Self-actions are disabled' : isLastSuperAdmin ? 'Last active super admin cannot be deactivated' : undefined}>
                          {selectedUser.isActive ? <UserX className="h-3.5 w-3.5" aria-hidden="true" /> : <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                          {selectedUser.isActive ? 'Deactivate' : 'Activate'}
                        </ActionButton>
                        <ActionButton onClick={() => handleRoleChange(selectedUser)} disabled={roleActionDisabled} tone="sky" title={isSelf ? 'Self-actions are disabled' : isLastSuperAdmin ? 'Last active super admin cannot be demoted' : undefined}>
                          <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                          {selectedUser.platformRole === 'superadmin' ? 'Demote' : 'Promote'}
                        </ActionButton>
                        <ActionButton onClick={() => viewMemberships(selectedUser)} tone="green">
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          Memberships
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isLoading ? <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-slate-400">Loading users...</div> : null}
        {!isLoading && usersList.length === 0 ? <div className="p-5"><EmptyState>No users match your filters.</EmptyState></div> : null}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </section>

      {selectedMembershipUser ? (
        <Panel title={`${selectedMembershipUser.name || selectedMembershipUser.email} memberships`} description="Organizations this user belongs to.">
          {membershipsLoading ? (
            <LoadingPanel label="Loading memberships" />
          ) : memberships.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-left text-sm dark:divide-slate-800">
                <thead className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Organization</th>
                    <th className="px-3 py-2 font-semibold">Role</th>
                    <th className="px-3 py-2 font-semibold">Plan</th>
                    <th className="px-3 py-2 font-semibold">Joined</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {memberships.map((membership) => (
                    <tr key={getId(membership)}>
                      <td className="px-3 py-3 font-medium text-gray-950 dark:text-slate-50">{membership.orgId?.name || 'Deleted organization'}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-slate-300">{membership.role}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={membership.orgId?.plan === 'pro' ? 'sky' : 'gray'}>{formatPlan(membership.orgId?.plan)}</StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-slate-300">{formatDate(membership.joinedAt)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={membership.orgId?.isDeleted ? 'red' : 'emerald'}>
                          {membership.orgId?.isDeleted ? 'Suspended' : 'Active'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>This user has no memberships.</EmptyState>
          )}
        </Panel>
      ) : null}
    </div>
  );
};
