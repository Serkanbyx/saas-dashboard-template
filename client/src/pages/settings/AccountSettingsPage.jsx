import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ImagePlus,
  KeyRound,
  Loader2,
  Monitor,
  Moon,
  Palette,
  Save,
  ShieldAlert,
  Sun,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOrg } from '../../hooks/useOrg';
import { useTheme } from '../../hooks/useTheme';
import * as authService from '../../services/authService';
import * as membershipService from '../../services/membershipService';
import * as uploadService from '../../services/uploadService';

const getRecordId = (record) => record?._id || record?.id;

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallbackMessage;

const getUserInitials = (user) => {
  const fallbackName = user?.name || user?.email || 'User';

  return fallbackName
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const sectionLinks = [
  { id: 'profile', label: 'Profile', icon: UserCircle },
  { id: 'password', label: 'Password', icon: KeyRound },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'organizations', label: 'Organizations', icon: Building2 },
  { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
];

const themeOptions = [
  {
    value: 'light',
    label: 'Light',
    description: 'Use a bright interface all the time.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Use a low-light interface all the time.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow your device preference automatically.',
    icon: Monitor,
  },
];

const SettingsSection = ({ children, description, icon: Icon, id, title }) => (
  <section id={id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start gap-3">
      <span className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-cyan-950/40 dark:text-cyan-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-gray-950 dark:text-slate-50">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-slate-400">{description}</p>
      </div>
    </div>
    <div className="mt-6">{children}</div>
  </section>
);

const FieldLabel = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-900 dark:text-slate-100">
    {children}
  </label>
);

const textInputClassName =
  'mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-950 dark:disabled:bg-slate-900';

const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 dark:focus:ring-offset-slate-900';

const secondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800';

const dangerButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900';

export const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth() || {};
  const { orgs = [], removeOrgLocally, refreshOrgs } = useOrg() || {};
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [profileValues, setProfileValues] = useState({ avatar: '', name: '' });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwordValues, setPasswordValues] = useState({ confirmPassword: '', currentPassword: '', newPassword: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [leavingOrgId, setLeavingOrgId] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    setProfileValues({
      avatar: user?.avatar || '',
      name: user?.name || '',
    });
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl('');
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const avatarUrl = avatarPreviewUrl || profileValues.avatar;
  const hasProfileChanges =
    profileValues.name !== (user?.name || '') || profileValues.avatar !== (user?.avatar || '') || Boolean(selectedAvatarFile);
  const isProfileSaveDisabled = isSavingProfile || profileValues.name.trim().length < 2 || !hasProfileChanges;
  const isPasswordMismatch =
    passwordValues.newPassword.length > 0 &&
    passwordValues.confirmPassword.length > 0 &&
    passwordValues.newPassword !== passwordValues.confirmPassword;
  const isPasswordSaveDisabled =
    isChangingPassword ||
    !passwordValues.currentPassword ||
    passwordValues.newPassword.length < 8 ||
    passwordValues.newPassword !== passwordValues.confirmPassword;
  const isDeleteDisabled = isDeletingAccount || !deletePassword;

  const organizationCountLabel = useMemo(() => {
    const count = orgs.length;
    return `${count} organization${count === 1 ? '' : 's'}`;
  }, [orgs.length]);

  const setAvatarFile = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }

    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarDrop = (event) => {
    event.preventDefault();
    setIsDraggingAvatar(false);
    setAvatarFile(event.dataTransfer.files?.[0]);
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (isProfileSaveDisabled) {
      return;
    }

    const previousUser = user;
    setIsSavingProfile(true);

    try {
      let avatar = profileValues.avatar;

      if (selectedAvatarFile) {
        const uploadResponse = await uploadService.uploadAvatar(selectedAvatarFile);
        avatar = uploadResponse.data?.data?.url || '';
      }

      const payload = {
        avatar,
        name: profileValues.name.trim(),
      };
      const optimisticUser = { ...user, ...payload };

      updateUser?.(payload);
      const response = await authService.updateProfile(payload);
      const updatedUser = response.data?.data?.user || optimisticUser;

      updateUser?.(updatedUser);
      setProfileValues({ avatar: updatedUser.avatar || '', name: updatedUser.name || '' });
      setSelectedAvatarFile(null);
      setAvatarPreviewUrl('');
      toast.success('Profile updated');
    } catch (error) {
      if (previousUser) {
        updateUser?.(previousUser);
      }
      toast.error(getErrorMessage(error, 'Profile could not be updated.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (isPasswordSaveDisabled) {
      return;
    }

    setIsChangingPassword(true);

    try {
      await authService.changePassword({
        currentPassword: passwordValues.currentPassword,
        newPassword: passwordValues.newPassword,
      });
      setPasswordValues({ confirmPassword: '', currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Password could not be changed.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLeaveOrganization = async (organization) => {
    const orgId = getRecordId(organization);

    if (!orgId || organization.role === 'owner' || leavingOrgId) {
      return;
    }

    const confirmed = window.confirm(`Leave ${organization.name}? You will lose access to this organization.`);

    if (!confirmed) {
      return;
    }

    setLeavingOrgId(orgId);

    try {
      await membershipService.leaveOrg(orgId);
      const nextOrgs = removeOrgLocally?.(orgId) || orgs.filter((org) => getRecordId(org) !== orgId);
      toast.success(`You left ${organization.name}`);

      if (nextOrgs.length === 0) {
        navigate('/create-org', { replace: true });
      } else {
        await refreshOrgs?.();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Organization could not be left.'));
    } finally {
      setLeavingOrgId('');
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();

    if (isDeleteDisabled) {
      return;
    }

    const confirmed = window.confirm('Delete your account permanently? This action cannot be undone.');

    if (!confirmed) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      await authService.deleteAccount({ password: deletePassword });
      toast.success('Account deleted');
      logout?.('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Account could not be deleted.'));
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <section className="col-span-12 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">
              Account Settings
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">
              Manage your personal account
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
              Keep profile details, password security, appearance preferences, and organization access up to date.
            </p>
          </div>
          <span className="w-fit rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 dark:bg-cyan-950/40 dark:text-cyan-200">
            {organizationCountLabel}
          </span>
        </div>
      </section>

      <aside className="col-span-12 lg:col-span-3">
        <nav
          className="sticky top-24 space-y-2 rounded-3xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          aria-label="Account settings sections"
        >
          {sectionLinks.map((section) => {
            const Icon = section.icon;

            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {section.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="col-span-12 space-y-6 lg:col-span-9">
        <SettingsSection
          id="profile"
          icon={UserCircle}
          title="Profile"
          description="Update your display name and avatar. Your email is intentionally read-only."
        >
          <form className="space-y-6" onSubmit={handleProfileSave}>
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div
                className={[
                  'flex min-h-52 flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-5 text-center transition',
                  isDraggingAvatar
                    ? 'border-brand-500 bg-brand-50 dark:border-cyan-400 dark:bg-cyan-950/30'
                    : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-950',
                ].join(' ')}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingAvatar(true);
                }}
                onDragLeave={() => setIsDraggingAvatar(false)}
                onDrop={handleAvatarDrop}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Account avatar preview" className="h-20 w-20 rounded-full object-cover shadow-sm" />
                ) : (
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-bold text-brand-700 shadow-sm dark:bg-slate-900 dark:text-cyan-200">
                    {getUserInitials(user)}
                  </span>
                )}
                <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-slate-100">Drop an avatar here</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">PNG, JPG, or WebP images work best.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <label className={secondaryButtonClassName}>
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    Choose file
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => setAvatarFile(event.target.files?.[0])}
                    />
                  </label>
                  {profileValues.avatar || selectedAvatarFile ? (
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      onClick={() => {
                        if (avatarPreviewUrl) {
                          URL.revokeObjectURL(avatarPreviewUrl);
                        }
                        setSelectedAvatarFile(null);
                        setAvatarPreviewUrl('');
                        setProfileValues((current) => ({ ...current, avatar: '' }));
                      }}
                    >
                      Remove avatar
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <FieldLabel htmlFor="account-name">Name</FieldLabel>
                  <input
                    id="account-name"
                    type="text"
                    value={profileValues.name}
                    onChange={(event) => setProfileValues((current) => ({ ...current, name: event.target.value }))}
                    className={textInputClassName}
                    minLength={2}
                    maxLength={60}
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="account-email">Email</FieldLabel>
                  <input id="account-email" type="email" value={user?.email || ''} className={textInputClassName} disabled />
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                    Email changes are disabled to prevent account hijacking from this screen.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className={primaryButtonClassName} disabled={isProfileSaveDisabled}>
                {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                Save profile
              </button>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection
          id="password"
          icon={KeyRound}
          title="Password"
          description="Change your password after confirming your current password."
        >
          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleChangePassword}>
            <div>
              <FieldLabel htmlFor="current-password">Current password</FieldLabel>
              <input
                id="current-password"
                type="password"
                value={passwordValues.currentPassword}
                onChange={(event) => setPasswordValues((current) => ({ ...current, currentPassword: event.target.value }))}
                className={textInputClassName}
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <input
                id="new-password"
                type="password"
                value={passwordValues.newPassword}
                onChange={(event) => setPasswordValues((current) => ({ ...current, newPassword: event.target.value }))}
                className={textInputClassName}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
              <input
                id="confirm-password"
                type="password"
                value={passwordValues.confirmPassword}
                onChange={(event) => setPasswordValues((current) => ({ ...current, confirmPassword: event.target.value }))}
                className={textInputClassName}
                autoComplete="new-password"
                minLength={8}
                required
              />
              {isPasswordMismatch ? <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">Passwords do not match.</p> : null}
            </div>
            <div className="md:col-span-3 md:flex md:justify-end">
              <button type="submit" className={primaryButtonClassName} disabled={isPasswordSaveDisabled}>
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
                Change password
              </button>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection
          id="appearance"
          icon={Palette}
          title="Appearance"
          description="Choose how the dashboard theme should be resolved."
        >
          <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Theme preference">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTheme(option.value)}
                  className={[
                    'rounded-3xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500',
                    isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-900 dark:border-cyan-400 dark:bg-cyan-950/30 dark:text-cyan-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {option.label}
                    </span>
                    {isSelected ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : null}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-slate-400">{option.description}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
            Current resolved theme: <span className="font-semibold text-gray-900 dark:text-slate-100">{resolvedTheme}</span>
          </p>
        </SettingsSection>

        <SettingsSection
          id="organizations"
          icon={Building2}
          title="Organizations"
          description="Review your organization memberships and leave organizations you no longer need."
        >
          {orgs.length > 0 ? (
            <ul className="space-y-3">
              {orgs.map((organization) => {
                const orgId = getRecordId(organization);
                const isOwner = organization.role === 'owner';
                const isLeaving = leavingOrgId === orgId;

                return (
                  <li
                    key={orgId}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-950 dark:text-slate-50">{organization.name}</p>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-gray-600 ring-1 ring-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                          {organization.role || 'member'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        {isOwner ? 'Transfer ownership before leaving this organization.' : 'You can leave this organization at any time.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={secondaryButtonClassName}
                      disabled={isOwner || Boolean(leavingOrgId)}
                      onClick={() => handleLeaveOrganization(organization)}
                    >
                      {isLeaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Building2 className="h-4 w-4" aria-hidden="true" />}
                      Leave organization
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-slate-400">
              You do not belong to an organization yet.
            </p>
          )}
        </SettingsSection>

        <SettingsSection
          id="danger"
          icon={ShieldAlert}
          title="Danger Zone"
          description="Deleting your account requires your password and permanently removes your access."
        >
          <form className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/20" onSubmit={handleDeleteAccount}>
            <div className="flex items-start gap-3 text-red-700 dark:text-red-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold">Delete account</h3>
                <p className="mt-1 text-sm leading-6">
                  This removes your account and related personal data. Owner organizations may be transferred or deleted by the backend rules.
                </p>
              </div>
            </div>
            <div className="mt-5 max-w-md">
              <FieldLabel htmlFor="delete-account-password">Password</FieldLabel>
              <input
                id="delete-account-password"
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                className={textInputClassName}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="mt-5">
              <button type="submit" className={dangerButtonClassName} disabled={isDeleteDisabled}>
                {isDeletingAccount ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                Delete account
              </button>
            </div>
          </form>
        </SettingsSection>
      </div>
    </div>
  );
};
