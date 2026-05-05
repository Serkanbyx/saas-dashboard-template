import { Loader2, MoreHorizontal, Search } from 'lucide-react';

const roleStyles = {
  owner: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:ring-purple-900/70',
  admin: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/70',
  member: 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
};

const getRecordId = (record) => record?._id || record?.id;

const getUserId = (user) => user?._id || user?.id;

const getMemberUser = (membership) => membership?.userId || membership?.user || {};

const getDisplayName = (user) => user?.name || user?.email || 'Unknown user';

const getInitials = (user) =>
  getDisplayName(user)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const formatRole = (role) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member');

export const RoleBadge = ({ role }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${roleStyles[role] || roleStyles.member}`}>
    {formatRole(role)}
  </span>
);

const Avatar = ({ user }) => {
  const name = getDisplayName(user);

  if (user?.avatar) {
    return <img src={user.avatar} alt={`${name} avatar`} className="h-10 w-10 rounded-full object-cover" />;
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200">
      {getInitials(user) || '?'}
    </span>
  );
};

export const MembersTable = ({
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

      <div className="overflow-x-auto">
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
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600 dark:text-cyan-300" aria-hidden="true" />
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
                          <Avatar user={user} />
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
                              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
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
    </section>
  );
};
