import { memo } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
import { Avatar, RoleBadge, Spinner } from '../common';

export { RoleBadge };

const getRecordId = (record) => record?._id || record?.id;

const getUserId = (user) => user?._id || user?.id;

const getMemberUser = (membership) => membership?.userId || membership?.user || {};

const getDisplayName = (user) => user?.name || user?.email || 'Unknown user';

const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const formatRole = (role) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member');

export const MembersTable = memo(({
  actionMembershipId,
  currentUser,
  focusedMembershipId = '',
  isLoading = false,
  members = [],
  onRemove,
  onRoleChange,
  onSearchChange,
  search,
  canRemoveMembers = false,
  canUpdateMembers = false,
}) => {
  const currentUserId = getUserId(currentUser);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-gray-200 p-5 dark:border-slate-800">
        <label className="relative block max-w-md">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
          />
        </label>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-3">
                Member
              </th>
              <th scope="col" className="px-5 py-3">
                Email
              </th>
              <th scope="col" className="px-5 py-3">
                Role
              </th>
              <th scope="col" className="px-5 py-3">
                Joined
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-500 dark:text-slate-400">
                  <Spinner className="mx-auto" label="Loading members" />
                  <span className="mt-3 block">Loading members...</span>
                </td>
              </tr>
            ) : null}

            {!isLoading && members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-500 dark:text-slate-400">
                  No members found.
                </td>
              </tr>
            ) : null}

            {!isLoading
              ? members.map((membership) => {
                  const membershipId = getRecordId(membership);
                  const user = getMemberUser(membership);
                  const isSelf = getUserId(user) === currentUserId;
                  const isOwner = membership.role === 'owner';
                  const disableActions = isSelf || isOwner || (!canUpdateMembers && !canRemoveMembers);
                  const isBusy = actionMembershipId === membershipId;
                  const isFocused = focusedMembershipId === membershipId;

                  return (
                    <tr
                      key={membershipId}
                      id={`member-${membershipId}`}
                      className={`bg-white transition hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/70 ${
                        isFocused ? 'ring-4 ring-inset ring-brand-100 dark:ring-cyan-950/70' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={getDisplayName(user)} src={user?.avatar} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-950 dark:text-slate-50">{getDisplayName(user)}</p>
                            {isSelf ? <p className="text-xs text-brand-600 dark:text-cyan-300">You</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{user?.email || 'Unknown'}</td>
                      <td className="px-5 py-4">
                        <RoleBadge role={membership.role} />
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{formatDate(membership.joinedAt || membership.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <details className="group relative">
                            <summary
                              className={`flex h-9 w-9 list-none items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition marker:hidden focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-300 ${
                                disableActions
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'cursor-pointer hover:border-brand-500 hover:text-brand-600 dark:hover:border-cyan-400 dark:hover:text-cyan-300'
                              }`}
                              aria-label={`Actions for ${getDisplayName(user)}`}
                              aria-disabled={disableActions}
                              onClick={(event) => {
                                if (disableActions) {
                                  event.preventDefault();
                                }
                              }}
                            >
                              {isBusy ? <Spinner color="current" label="Updating member" size="sm" /> : <MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
                            </summary>
                            <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                              <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
                                Change Role
                              </p>
                              {['admin', 'member'].map((role) => (
                                <button
                                  key={role}
                                  type="button"
                                  disabled={!canUpdateMembers || membership.role === role || isBusy}
                                  onClick={() => onRoleChange(membership, role)}
                                  className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  {formatRole(role)}
                                </button>
                              ))}
                              <button
                                type="button"
                                disabled={!canRemoveMembers || isBusy}
                                onClick={() => onRemove(membership)}
                                className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
                              >
                                Remove
                              </button>
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 px-5 py-8 text-center text-gray-500 dark:border-slate-800 dark:text-slate-400">
            <Spinner className="mx-auto" label="Loading members" />
            <span className="mt-3 block text-sm">Loading members...</span>
          </div>
        ) : null}

        {!isLoading && members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
            No members found.
          </div>
        ) : null}

        {!isLoading
          ? members.map((membership) => {
              const membershipId = getRecordId(membership);
              const user = getMemberUser(membership);
              const isSelf = getUserId(user) === currentUserId;
              const isOwner = membership.role === 'owner';
              const disableActions = isSelf || isOwner || (!canUpdateMembers && !canRemoveMembers);
              const isBusy = actionMembershipId === membershipId;
              const isFocused = focusedMembershipId === membershipId;

              return (
                <article
                  key={membershipId}
                  id={`member-card-${membershipId}`}
                  className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${
                    isFocused ? 'border-brand-300 ring-4 ring-brand-100 dark:border-cyan-500 dark:ring-cyan-950/70' : 'border-gray-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={getDisplayName(user)} src={user?.avatar} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-950 dark:text-slate-50">{getDisplayName(user)}</h3>
                        {isSelf ? <span className="text-xs font-semibold text-brand-600 dark:text-cyan-300">You</span> : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-gray-500 dark:text-slate-400">{user?.email || 'Unknown'}</p>
                    </div>
                    <RoleBadge role={membership.role} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Joined</dt>
                      <dd className="mt-1 text-gray-700 dark:text-slate-200">{formatDate(membership.joinedAt || membership.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">Actions</dt>
                      <dd className="mt-1">
                        <details className="group relative">
                          <summary
                            className={`inline-flex list-none items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 marker:hidden focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-200 ${
                              disableActions ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            }`}
                            onClick={(event) => {
                              if (disableActions) {
                                event.preventDefault();
                              }
                            }}
                          >
                            {isBusy ? <Spinner color="current" label="Updating member" size="sm" /> : <MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
                            Manage
                          </summary>
                          <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                            {['admin', 'member'].map((role) => (
                              <button
                                key={role}
                                type="button"
                                disabled={!canUpdateMembers || membership.role === role || isBusy}
                                onClick={() => onRoleChange(membership, role)}
                                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {formatRole(role)}
                              </button>
                            ))}
                            <button
                              type="button"
                              disabled={!canRemoveMembers || isBusy}
                              onClick={() => onRemove(membership)}
                              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
                            >
                              Remove
                            </button>
                          </div>
                        </details>
                      </dd>
                    </div>
                  </dl>
                </article>
              );
            })
          : null}
      </div>
    </section>
  );
});

MembersTable.displayName = 'MembersTable';
