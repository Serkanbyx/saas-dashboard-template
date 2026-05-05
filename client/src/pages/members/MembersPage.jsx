import { MailPlus, RefreshCw, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MembersTable, RoleBadge } from '../../components/members/MembersTable';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { useOrg } from '../../hooks/useOrg';
import * as invitationService from '../../services/invitationService';
import * as membershipService from '../../services/membershipService';
import { usePermissions } from '../../utils/permissions';

const getRecordId = (record) => record?._id || record?.id;

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallbackMessage;

const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value));
};

const getInviterName = (invitation) => invitation?.invitedBy?.name || invitation?.invitedBy?.email || 'Unknown';

const StatCard = ({ icon: Icon, label, value, children }) => (
  <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">{value}</p>
      </div>
      <span className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
    {children}
  </article>
);

const EmptyState = ({ children }) => (
  <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
    {children}
  </div>
);

const InviteMemberModal = ({ isSubmitting, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ email: email.trim().toLowerCase(), role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="invite-member-title">
      <button type="button" className="absolute inset-0 bg-slate-950/60" aria-label="Close invite modal" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Invite</p>
          <h2 id="invite-member-title" className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">
            Invite Member
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-slate-300">
            Send a workspace invitation. Owner is intentionally excluded from invite roles.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@example.com"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-900"
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Send Invite
          </button>
        </div>
      </form>
    </div>
  );
};

const PendingInvitationsTable = ({ actionInvitationId, canManageInvitations, invitations, onResend, onRevoke }) => {
  if (invitations.length === 0) {
    return <EmptyState>No pending invitations.</EmptyState>;
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-5 py-3">
                Email
              </th>
              <th scope="col" className="px-5 py-3">
                Role
              </th>
              <th scope="col" className="px-5 py-3">
                Invited By
              </th>
              <th scope="col" className="px-5 py-3">
                Sent Date
              </th>
              <th scope="col" className="px-5 py-3">
                Expires
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
            {invitations.map((invitation) => {
              const invitationId = getRecordId(invitation);
              const isBusy = actionInvitationId === invitationId;

              return (
                <tr key={invitationId} className="bg-white transition hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800/70">
                  <td className="px-5 py-4 font-medium text-gray-950 dark:text-slate-50">{invitation.email}</td>
                  <td className="px-5 py-4">
                    <RoleBadge role={invitation.role} />
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{getInviterName(invitation)}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{formatDate(invitation.createdAt)}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-slate-300">{formatDate(invitation.expiresAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={!canManageInvitations || isBusy}
                        onClick={() => onResend(invitation)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-cyan-300"
                      >
                        <RefreshCw className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} aria-hidden="true" />
                        Resend
                      </button>
                      <button
                        type="button"
                        disabled={!canManageInvitations || isBusy}
                        onClick={() => onRevoke(invitation)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export const MembersPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth() || {};
  const { activeOrg } = useOrg() || {};
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('members');
  const [overview, setOverview] = useState(null);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [pageError, setPageError] = useState('');
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [actionMembershipId, setActionMembershipId] = useState('');
  const [actionInvitationId, setActionInvitationId] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const activeOrgId = getRecordId(activeOrg);
  const canInviteMembers = can('members:invite');
  const canUpdateMembers = can('members:update');
  const canRemoveMembers = can('members:remove');

  const pendingInvitations = useMemo(
    () => (overview?.pendingInvitations || []).filter((invitation) => invitation.status === 'pending'),
    [overview?.pendingInvitations],
  );

  const counts = overview?.counts || {};
  const seats = overview?.seats || {};
  const seatLimit = seats.limit || activeOrg?.seatLimit || 0;
  const seatsUsed = seats.used ?? counts.total ?? members.length;
  const seatPercent = seatLimit > 0 ? Math.min(Math.round((seatsUsed / seatLimit) * 100), 100) : 0;

  const loadOverview = useCallback(async () => {
    if (!activeOrgId) {
      setOverview(null);
      setIsLoadingOverview(false);
      return;
    }

    setIsLoadingOverview(true);
    setPageError('');

    try {
      const response = await membershipService.getMembersOverview();
      setOverview(response.data?.data || null);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Members overview could not be loaded.'));
    } finally {
      setIsLoadingOverview(false);
    }
  }, [activeOrgId]);

  const loadMembers = useCallback(async () => {
    if (!activeOrgId) {
      setMembers([]);
      setIsLoadingMembers(false);
      return;
    }

    setIsLoadingMembers(true);

    try {
      const response = await membershipService.listMembers({
        limit: 50,
        search: debouncedSearch || undefined,
      });
      setMembers(response.data?.data?.memberships || []);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Members could not be loaded.'));
    } finally {
      setIsLoadingMembers(false);
    }
  }, [activeOrgId, debouncedSearch]);

  const refreshMembersPage = useCallback(async () => {
    await Promise.all([loadOverview(), loadMembers()]);
  }, [loadMembers, loadOverview]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (searchParams.get('invite') === 'true' && canInviteMembers) {
      setIsInviteModalOpen(true);
    }
  }, [canInviteMembers, searchParams]);

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    if (searchParams.get('invite')) {
      navigate('/app/members', { replace: true });
    }
  };

  const handleInviteMember = async (payload) => {
    setIsInviting(true);

    try {
      await invitationService.createInvitation(payload);
      toast.success('Invitation sent');
      closeInviteModal();
      await refreshMembersPage();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invitation could not be sent.'));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (membership, role) => {
    const membershipId = getRecordId(membership);
    const previousMembers = members;

    setActionMembershipId(membershipId);
    setMembers((currentMembers) =>
      currentMembers.map((currentMember) => (getRecordId(currentMember) === membershipId ? { ...currentMember, role } : currentMember)),
    );

    try {
      await membershipService.updateMemberRole(membershipId, { role });
      toast.success('Role updated');
      await loadOverview();
    } catch (error) {
      setMembers(previousMembers);
      toast.error(getErrorMessage(error, 'Role could not be updated.'));
    } finally {
      setActionMembershipId('');
    }
  };

  const handleRemoveMember = async (membership) => {
    const membershipId = getRecordId(membership);
    const previousMembers = members;
    const previousOverview = overview;

    setActionMembershipId(membershipId);
    setMembers((currentMembers) => currentMembers.filter((currentMember) => getRecordId(currentMember) !== membershipId));
    setOverview((currentOverview) =>
      currentOverview
        ? {
            ...currentOverview,
            counts: {
              ...currentOverview.counts,
              total: Math.max((currentOverview.counts?.total || 1) - 1, 0),
            },
            seats: {
              ...currentOverview.seats,
              used: Math.max((currentOverview.seats?.used || 1) - 1, 0),
            },
          }
        : currentOverview,
    );

    try {
      await membershipService.removeMember(membershipId);
      toast.success('Member removed');
      await refreshMembersPage();
    } catch (error) {
      setMembers(previousMembers);
      setOverview(previousOverview);
      toast.error(getErrorMessage(error, 'Member could not be removed.'));
    } finally {
      setActionMembershipId('');
    }
  };

  const handleResendInvitation = async (invitation) => {
    const invitationId = getRecordId(invitation);
    setActionInvitationId(invitationId);

    try {
      await invitationService.resendInvitation(invitationId);
      toast.success('Invitation resent');
      await loadOverview();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invitation could not be resent.'));
    } finally {
      setActionInvitationId('');
    }
  };

  const handleRevokeInvitation = async (invitation) => {
    const invitationId = getRecordId(invitation);
    const previousOverview = overview;

    setActionInvitationId(invitationId);
    setOverview((currentOverview) =>
      currentOverview
        ? {
            ...currentOverview,
            pendingInvitations: (currentOverview.pendingInvitations || []).filter((currentInvitation) => getRecordId(currentInvitation) !== invitationId),
            counts: {
              ...currentOverview.counts,
              pending: Math.max((currentOverview.counts?.pending || 1) - 1, 0),
            },
          }
        : currentOverview,
    );

    try {
      await invitationService.revokeInvitation(invitationId);
      toast.success('Invitation revoked');
      await loadOverview();
    } catch (error) {
      setOverview(previousOverview);
      toast.error(getErrorMessage(error, 'Invitation could not be revoked.'));
    } finally {
      setActionInvitationId('');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">
              {activeOrg?.name || 'Workspace'}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Members</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
              Manage active members, pending invitations, and workspace roles.
            </p>
          </div>
          {canInviteMembers ? (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Invite Member
            </button>
          ) : null}
        </div>
      </section>

      {pageError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {pageError}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3" aria-label="Member stats">
        <StatCard icon={Users} label="Total Members" value={isLoadingOverview ? '...' : counts.total || members.length} />
        <StatCard icon={MailPlus} label="Pending Invitations" value={isLoadingOverview ? '...' : counts.pending || pendingInvitations.length} />
        <StatCard icon={UserPlus} label="Seats Used" value={isLoadingOverview ? '...' : `${seatsUsed} / ${seatLimit || '∞'}`}>
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800" aria-hidden="true">
              <div className="h-full rounded-full bg-brand-600 transition-all dark:bg-cyan-300" style={{ width: `${seatPercent}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{seatLimit > 0 ? `${seatPercent}% of seats used` : 'No seat limit'}</p>
          </div>
        </StatCard>
      </section>

      <div className="flex gap-2 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          { id: 'members', label: 'Active Members' },
          { id: 'invitations', label: 'Pending Invitations' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-sm dark:bg-cyan-400 dark:text-slate-950'
                : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'members' ? (
        <MembersTable
          actionMembershipId={actionMembershipId}
          currentUser={user}
          isLoading={isLoadingMembers}
          members={members}
          onRemove={handleRemoveMember}
          onRoleChange={handleRoleChange}
          onSearchChange={setSearch}
          search={search}
          canRemoveMembers={canRemoveMembers}
          canUpdateMembers={canUpdateMembers}
        />
      ) : (
        <PendingInvitationsTable
          actionInvitationId={actionInvitationId}
          canManageInvitations={canInviteMembers}
          invitations={pendingInvitations}
          onResend={handleResendInvitation}
          onRevoke={handleRevokeInvitation}
        />
      )}

      {isInviteModalOpen ? <InviteMemberModal isSubmitting={isInviting} onClose={closeInviteModal} onSubmit={handleInviteMember} /> : null}
    </div>
  );
};
