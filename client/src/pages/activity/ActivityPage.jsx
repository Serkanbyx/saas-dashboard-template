import { Activity, CalendarDays, Filter, Loader2, RefreshCw, Sparkles, UserCircle, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrg } from '../../hooks/useOrg';
import { useSocket } from '../../hooks/useSocket';
import * as activityService from '../../services/activityService';
import * as membershipService from '../../services/membershipService';
import { activityActionOptions, formatActivity } from '../../utils/activityFormatter';

const pageSize = 20;

const getRecordId = (record) => record?._id || record?.id;

const getActorId = (activityLog) => {
  const actor = activityLog?.actorId;
  return typeof actor === 'object' ? getRecordId(actor) : actor;
};

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallbackMessage;

const formatDateTime = (value) => {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatDay = (value) => {
  const activityDate = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (activityDate.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (activityDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(activityDate);
};

const isActivityInRange = (activityLog, { endDate, startDate }) => {
  if (!startDate && !endDate) {
    return true;
  }

  const createdAt = new Date(activityLog.createdAt).getTime();
  const startsAt = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : Number.NEGATIVE_INFINITY;
  const endsAt = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Number.POSITIVE_INFINITY;

  return createdAt >= startsAt && createdAt <= endsAt;
};

const matchesFilters = (activityLog, filters) => {
  const matchesAction = filters.actions.length === 0 || filters.actions.includes(activityLog?.action);
  const matchesActor = !filters.actorId || getActorId(activityLog) === filters.actorId;

  return matchesAction && matchesActor && isActivityInRange(activityLog, filters);
};

const getMemberUser = (membership) => membership?.userId || {};

const getMemberLabel = (membership) => {
  const user = getMemberUser(membership);
  return user.name || user.email || 'Unknown member';
};

const Avatar = ({ actor }) => {
  const name = actor?.name || actor?.email || 'Someone';
  const initials = name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (actor?.avatar) {
    return <img src={actor.avatar} alt="" className="h-10 w-10 rounded-2xl object-cover" />;
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-cyan-950/50 dark:text-cyan-200">
      {initials || <UserCircle className="h-5 w-5" aria-hidden="true" />}
    </span>
  );
};

const EmptyState = () => (
  <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
      <Sparkles className="h-8 w-8" aria-hidden="true" />
    </div>
    <h2 className="mt-5 text-lg font-semibold text-gray-950 dark:text-slate-50">No activity yet</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-slate-400">
      Workspace events will appear here when your team invites members, changes roles, updates billing, or edits organization settings.
    </p>
  </div>
);

const ActivitySkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex animate-pulse gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gray-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-slate-800" />
            <div className="h-3 w-32 rounded-full bg-gray-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FiltersBar = ({ actorId, endDate, members, onActionToggle, onClearFilters, onFilterChange, selectedActions, startDate }) => {
  const hasFilters = selectedActions.length > 0 || actorId || startDate || endDate;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="activity-filters">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-2xl bg-gray-100 p-2 text-gray-600 dark:bg-slate-800 dark:text-slate-300">
            <Filter className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 id="activity-filters" className="text-base font-semibold text-gray-950 dark:text-slate-50">
              Filters
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Narrow the timeline by action, actor, and date range.</p>
          </div>
        </div>

        {hasFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 dark:text-slate-200">Action type</legend>
          <div className="mt-2 flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1">
            {activityActionOptions.map((option) => {
              const isSelected = selectedActions.includes(option.value);

              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'border-brand-600 bg-brand-600 text-white dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950'
                      : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-700 dark:hover:text-cyan-200'
                  }`}
                >
                  <input type="checkbox" checked={isSelected} onChange={() => onActionToggle(option.value)} className="sr-only" />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Actor</span>
          <select
            value={actorId}
            onChange={(event) => onFilterChange('actorId', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
          >
            <option value="">All actors</option>
            {members.map((member) => {
              const user = getMemberUser(member);
              const userId = getRecordId(user);

              return (
                <option key={userId} value={userId}>
                  {getMemberLabel(member)}
                </option>
              );
            })}
          </select>
        </label>

        <div>
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">Date range</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label>
              <span className="sr-only">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => onFilterChange('startDate', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              />
            </label>
            <label>
              <span className="sr-only">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => onFilterChange('endDate', event.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
              />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};

const ActivityTimeline = ({ activities, highlightedIds }) => {
  const groups = activities.reduce((dayGroups, activityLog) => {
    const day = formatDay(activityLog.createdAt);
    const group = dayGroups.find((currentGroup) => currentGroup.day === day);

    if (group) {
      group.activities.push(activityLog);
      return dayGroups;
    }

    return [...dayGroups, { day, activities: [activityLog] }];
  }, []);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.day} aria-labelledby={`activity-day-${group.day.replaceAll(' ', '-').toLowerCase()}`}>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-300">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 id={`activity-day-${group.day.replaceAll(' ', '-').toLowerCase()}`} className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              {group.day}
            </h2>
          </div>

          <ol className="relative space-y-3 border-l border-gray-200 pl-5 dark:border-slate-800">
            {group.activities.map((activityLog) => {
              const activityId = getRecordId(activityLog);
              const actor = typeof activityLog.actorId === 'object' ? activityLog.actorId : null;
              const isHighlighted = highlightedIds.includes(activityId);

              return (
                <li
                  key={activityId}
                  id={`activity-${activityId}`}
                  className={`relative rounded-3xl border bg-white p-5 shadow-sm transition duration-700 dark:bg-slate-900 ${
                    isHighlighted
                      ? 'border-brand-300 ring-4 ring-brand-100 dark:border-cyan-500 dark:ring-cyan-950/70'
                      : 'border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <span className="absolute left-[-1.72rem] top-7 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-slate-950 dark:bg-cyan-300" />
                  <div className="flex gap-4">
                    <Avatar actor={actor} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-6 text-gray-950 dark:text-slate-50">{formatActivity(activityLog)}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{formatDateTime(activityLog.createdAt)}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
};

export const ActivityPage = () => {
  const [searchParams] = useSearchParams();
  const { activeOrg } = useOrg() || {};
  const { socket } = useSocket() || {};
  const activeOrgId = getRecordId(activeOrg);
  const focusedActivityId = searchParams.get('focus') || '';
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ actions: [], actorId: '', startDate: '', endDate: '' });
  const [pageError, setPageError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState([]);

  const hasMore = pagination.page < pagination.totalPages;
  const visibleHighlightedIds = useMemo(
    () => (focusedActivityId ? [...new Set([...highlightedIds, focusedActivityId])] : highlightedIds),
    [focusedActivityId, highlightedIds],
  );

  const requestParams = useMemo(
    () => ({
      action: filters.actions.length > 0 ? filters.actions.join(',') : undefined,
      actorId: filters.actorId || undefined,
      endDate: filters.endDate || undefined,
      limit: pageSize,
      startDate: filters.startDate || undefined,
    }),
    [filters],
  );

  const loadMembers = useCallback(async () => {
    if (!activeOrgId) {
      setMembers([]);
      return;
    }

    try {
      const response = await membershipService.getMembersOverview();
      setMembers(response.data?.data?.members || []);
    } catch (_error) {
      setMembers([]);
    }
  }, [activeOrgId]);

  const loadActivities = useCallback(
    async ({ append = false, page = 1 } = {}) => {
      if (!activeOrgId) {
        setActivities([]);
        setPagination({ page: 1, total: 0, totalPages: 1 });
        setIsLoading(false);
        return;
      }

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setPageError('');

      try {
        const response = await activityService.listActivity({ ...requestParams, page });
        const nextActivities = response.data?.data?.activities || [];
        const nextPagination = response.data?.data?.pagination || { page, total: nextActivities.length, totalPages: 1 };

        setActivities((currentActivities) => (append ? [...currentActivities, ...nextActivities] : nextActivities));
        setPagination(nextPagination);
      } catch (error) {
        setPageError(getErrorMessage(error, 'Activity could not be loaded.'));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeOrgId, requestParams],
  );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadActivities({ page: 1 });
  }, [loadActivities]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleNewActivity = (activityLog) => {
      if (!matchesFilters(activityLog, filters)) {
        return;
      }

      const activityId = getRecordId(activityLog);
      setActivities((currentActivities) => {
        if (currentActivities.some((currentActivity) => getRecordId(currentActivity) === activityId)) {
          return currentActivities;
        }

        return [activityLog, ...currentActivities];
      });
      setPagination((currentPagination) => ({ ...currentPagination, total: currentPagination.total + 1 }));
      setHighlightedIds((currentIds) => [activityId, ...currentIds]);

      window.setTimeout(() => {
        setHighlightedIds((currentIds) => currentIds.filter((currentId) => currentId !== activityId));
      }, 2500);
    };

    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [filters, socket]);

  useEffect(() => {
    if (!focusedActivityId || isLoading) {
      return;
    }

    window.setTimeout(() => {
      document.getElementById(`activity-${focusedActivityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  }, [focusedActivityId, isLoading]);

  const handleFilterChange = (name, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handleActionToggle = (action) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      actions: currentFilters.actions.includes(action)
        ? currentFilters.actions.filter((currentAction) => currentAction !== action)
        : [...currentFilters.actions, action],
    }));
  };

  const clearFilters = () => {
    setFilters({ actions: [], actorId: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">
              {activeOrg?.name || 'Workspace'}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Team Activity</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
              Review organization events in a paginated, real-time timeline scoped to your active workspace.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200">
            <Activity className="h-4 w-4" aria-hidden="true" />
            {pagination.total} events
          </span>
        </div>
      </section>

      <FiltersBar
        actorId={filters.actorId}
        endDate={filters.endDate}
        members={members}
        onActionToggle={handleActionToggle}
        onClearFilters={clearFilters}
        onFilterChange={handleFilterChange}
        selectedActions={filters.actions}
        startDate={filters.startDate}
      />

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {pageError}
        </div>
      ) : null}

      {isLoading ? (
        <ActivitySkeleton />
      ) : activities.length > 0 ? (
        <>
          <ActivityTimeline activities={activities} highlightedIds={visibleHighlightedIds} />
          {hasMore ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => loadActivities({ append: true, page: pagination.page + 1 })}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300 dark:focus:ring-offset-slate-950"
              >
                {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                Load more
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
};
