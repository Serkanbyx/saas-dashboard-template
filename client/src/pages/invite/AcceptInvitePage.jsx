import { Building2, CalendarClock, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOrg } from '../../hooks/useOrg';
import * as invitationService from '../../services/invitationService';

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallbackMessage;

const getNormalizedEmail = (email) => (email || '').trim().toLowerCase();

const formatRole = (role) => {
  if (!role) {
    return 'member';
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
};

const formatDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

const createAuthLink = ({ email, nextPath, pathname }) => {
  const params = new URLSearchParams();

  if (email) {
    params.set('email', email);
  }

  params.set('next', nextPath);

  return `${pathname}?${params.toString()}`;
};

const getStatusMessage = (invitation) => {
  if (!invitation) {
    return null;
  }

  if (invitation.status === 'expired') {
    return 'This invitation has expired. Please ask your organization admin to send a new invitation.';
  }

  if (invitation.status === 'revoked') {
    return 'This invitation has been revoked. Please contact your organization admin if you need access.';
  }

  if (invitation.status === 'accepted') {
    return 'This invitation has already been accepted.';
  }

  if (invitation.expiresAt && new Date(invitation.expiresAt) <= new Date()) {
    return 'This invitation has expired. Please ask your organization admin to send a new invitation.';
  }

  return null;
};

const InvitationLogo = ({ invitation }) => {
  const orgName = invitation?.org?.name || 'Organization';
  const logo = invitation?.org?.logo;

  if (logo) {
    return <img src={logo} alt={`${orgName} logo`} className="h-14 w-14 rounded-2xl object-contain" />;
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
      <Building2 className="h-7 w-7" aria-hidden="true" />
    </div>
  );
};

const PageNotice = ({ tone = 'info', children }) => {
  const classes =
    tone === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100';

  return <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${classes}`}>{children}</div>;
};

export const AcceptInvitePage = () => {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth() || {};
  const { refreshOrgs, switchOrg } = useOrg() || {};
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() || '';
  const [invitation, setInvitation] = useState(null);
  const [pageError, setPageError] = useState('');
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const nextPath = `${location.pathname}${location.search}`;

  const authLinks = useMemo(
    () => ({
      login: createAuthLink({ email: invitation?.email, nextPath, pathname: '/login' }),
      register: createAuthLink({ email: invitation?.email, nextPath, pathname: '/register' }),
    }),
    [invitation?.email, nextPath],
  );

  const statusMessage = getStatusMessage(invitation);
  const userEmail = getNormalizedEmail(user?.email);
  const invitationEmail = getNormalizedEmail(invitation?.email);
  const hasEmailMismatch = Boolean(isAuthenticated && invitationEmail && userEmail && invitationEmail !== userEmail);
  const canAccept = Boolean(isAuthenticated && invitation && !statusMessage && !hasEmailMismatch);

  useEffect(() => {
    let isMounted = true;

    const loadInvitation = async () => {
      if (!token) {
        setPageError('Invitation token is missing. Please open the invitation link from your email.');
        setIsLoadingInvitation(false);
        return;
      }

      setIsLoadingInvitation(true);
      setPageError('');

      try {
        const response = await invitationService.getInvitationByToken(token);
        if (isMounted) {
          setInvitation(response.data?.data?.invitation || null);
        }
      } catch (error) {
        if (isMounted) {
          setPageError(getErrorMessage(error, 'Invitation not found or no longer available.'));
        }
      } finally {
        if (isMounted) {
          setIsLoadingInvitation(false);
        }
      }
    };

    loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleLogout = () => {
    logout?.(authLinks.login);
  };

  const handleAcceptInvitation = async () => {
    if (!token || !canAccept) {
      return;
    }

    setIsAccepting(true);
    setPageError('');

    try {
      await invitationService.acceptInvitation({ token });
      const organizations = (await refreshOrgs?.()) || [];
      const acceptedOrgId = invitation.org?.id;

      if (acceptedOrgId) {
        switchOrg?.(acceptedOrgId, organizations);
      }

      toast.success('Invitation accepted');
      navigate('/app/dashboard', { replace: true });
    } catch (error) {
      setPageError(getErrorMessage(error, 'Unable to accept this invitation. Please try again.'));
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoadingInvitation || authLoading) {
    return (
      <div className="space-y-6 text-center" aria-live="polite" aria-busy="true">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand-600 dark:text-cyan-300" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Loading invitation</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">Checking your invitation details.</p>
        </div>
      </div>
    );
  }

  if (pageError && !invitation) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Invitation</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Invitation unavailable</h1>
        </div>
        <PageNotice tone="error">{pageError}</PageNotice>
        <Link
          to="/login"
          className="inline-flex w-full justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">Invitation</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Join your team</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-slate-300">Review this invitation before joining the workspace.</p>
      </div>

      {pageError ? <PageNotice tone="error">{pageError}</PageNotice> : null}
      {statusMessage ? <PageNotice>{statusMessage}</PageNotice> : null}

      <section className="rounded-3xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-start gap-4">
          <InvitationLogo invitation={invitation} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-gray-950 dark:text-slate-50">{invitation?.org?.name || 'Organization'}</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-300">
              {invitation?.inviter?.name || 'A team admin'} has invited you to join as{' '}
              <span className="font-semibold text-gray-950 dark:text-slate-50">{formatRole(invitation?.role)}</span>.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500 dark:text-slate-400">Sent to</dt>
            <dd className="break-all text-right font-semibold text-gray-900 dark:text-slate-100">{invitation?.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Expires
            </dt>
            <dd className="text-right font-semibold text-gray-900 dark:text-slate-100">
              {invitation?.expiresAt ? formatDate(invitation.expiresAt) : 'Unknown'}
            </dd>
          </div>
        </dl>
      </section>

      {!isAuthenticated ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to={authLinks.login}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Link>
          <Link
            to={authLinks.register}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Register
          </Link>
        </div>
      ) : null}

      {hasEmailMismatch ? (
        <PageNotice tone="error">
          This invitation was sent to <span className="font-semibold">{invitation.email}</span>. You're logged in as{' '}
          <span className="font-semibold">{user.email}</span>. Please log out and login with the correct account.
          <button type="button" onClick={handleLogout} className="mt-3 block font-semibold text-red-800 underline dark:text-red-100">
            Log out and continue
          </button>
        </PageNotice>
      ) : null}

      {canAccept ? (
        <button
          type="button"
          onClick={handleAcceptInvitation}
          disabled={isAccepting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:focus:ring-offset-slate-900"
        >
          {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Accept Invitation
        </button>
      ) : null}
    </div>
  );
};
