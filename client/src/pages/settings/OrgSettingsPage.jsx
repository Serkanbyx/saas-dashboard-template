import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  KeyRound,
  Link as LinkIcon,
  Loader2,
  Save,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOrg } from '../../hooks/useOrg';
import * as membershipService from '../../services/membershipService';
import * as organizationService from '../../services/organizationService';
import * as uploadService from '../../services/uploadService';
import { usePermissions } from '../../utils/permissions';

const getRecordId = (record) => record?._id || record?.id;

const getMemberUser = (membership) => membership?.userId || membership?.user || {};

const getUserId = (user) => user?._id || user?.id;

const getDisplayName = (user) => user?.name || user?.email || 'Unknown user';

const getErrorMessage = (error, fallbackMessage) =>
  error.response?.data?.message || error.response?.data?.errors?.[0]?.message || fallbackMessage;

const createOrgUrl = (slug) => {
  if (!slug || typeof window === 'undefined') {
    return '';
  }

  return `${window.location.origin}/org/${slug}`;
};

const sectionLinks = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'slug', label: 'Slug & URL', icon: LinkIcon },
  { id: 'danger', label: 'Danger Zone', icon: ShieldAlert },
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

export const OrgSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { activeOrg, refreshOrgs, replaceOrgLocally, removeOrgLocally } = useOrg() || {};
  const { can, role } = usePermissions();
  const activeOrgId = getRecordId(activeOrg);
  const canUpdateGeneral = can('members:update');
  const isOwner = role === 'owner';
  const [formValues, setFormValues] = useState({ description: '', logo: '', name: '' });
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [transferValues, setTransferValues] = useState({ membershipId: '', confirmPassword: '' });
  const [deleteValues, setDeleteValues] = useState({ confirmName: '', confirmPassword: '' });
  const [isTransferringOwnership, setIsTransferringOwnership] = useState(false);
  const [isDeletingOrg, setIsDeletingOrg] = useState(false);

  useEffect(() => {
    setFormValues({
      description: activeOrg?.description || '',
      logo: activeOrg?.logo || '',
      name: activeOrg?.name || '',
    });
    setSelectedLogoFile(null);
    setLogoPreviewUrl('');
    setTransferValues({ membershipId: '', confirmPassword: '' });
    setDeleteValues({ confirmName: '', confirmPassword: '' });
  }, [activeOrg]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const orgUrl = useMemo(() => createOrgUrl(activeOrg?.slug), [activeOrg?.slug]);
  const memberOptions = useMemo(() => {
    const currentUserId = getUserId(user);

    return members.filter((membership) => {
      const memberUser = getMemberUser(membership);
      return membership.role !== 'owner' && getUserId(memberUser) !== currentUserId;
    });
  }, [members, user]);

  const hasGeneralChanges =
    formValues.name !== (activeOrg?.name || '') ||
    formValues.description !== (activeOrg?.description || '') ||
    formValues.logo !== (activeOrg?.logo || '') ||
    Boolean(selectedLogoFile);
  const isGeneralSaveDisabled = !canUpdateGeneral || !activeOrgId || isSavingGeneral || formValues.name.trim().length < 2 || !hasGeneralChanges;
  const isTransferDisabled = !isOwner || !transferValues.membershipId || !transferValues.confirmPassword || isTransferringOwnership;
  const isDeleteDisabled =
    !isOwner || deleteValues.confirmName !== activeOrg?.name || !deleteValues.confirmPassword || isDeletingOrg || !activeOrgId;

  const loadMembers = useCallback(async () => {
    if (!isOwner || !activeOrgId) {
      setMembers([]);
      return;
    }

    setIsLoadingMembers(true);

    try {
      const response = await membershipService.getMembersOverview();
      setMembers(response.data?.data?.members || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Members could not be loaded.'));
    } finally {
      setIsLoadingMembers(false);
    }
  }, [activeOrgId, isOwner]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const setLogoFile = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setSelectedLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const handleLogoDrop = (event) => {
    event.preventDefault();
    setIsDraggingLogo(false);
    setLogoFile(event.dataTransfer.files?.[0]);
  };

  const handleGeneralSave = async (event) => {
    event.preventDefault();

    if (!activeOrgId || isGeneralSaveDisabled) {
      return;
    }

    const previousOrg = activeOrg;
    setIsSavingGeneral(true);

    try {
      let logoUrl = formValues.logo;

      if (selectedLogoFile) {
        const uploadResponse = await uploadService.uploadOrgLogo(selectedLogoFile);
        logoUrl = uploadResponse.data?.data?.url || '';
      }

      const payload = {
        description: formValues.description.trim(),
        logo: logoUrl,
        name: formValues.name.trim(),
      };
      const optimisticOrg = { ...activeOrg, ...payload };

      replaceOrgLocally?.(optimisticOrg);
      const response = await organizationService.updateOrg(activeOrgId, payload);
      replaceOrgLocally?.({ ...optimisticOrg, ...(response.data?.data?.organization || {}) });
      setSelectedLogoFile(null);
      setLogoPreviewUrl('');
      toast.success('Organization settings saved');
    } catch (error) {
      if (previousOrg) {
        replaceOrgLocally?.(previousOrg);
      }
      toast.error(getErrorMessage(error, 'Organization settings could not be saved.'));
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleTransferOwnership = async (event) => {
    event.preventDefault();

    if (isTransferDisabled) {
      return;
    }

    setIsTransferringOwnership(true);

    try {
      await membershipService.transferOwnership(transferValues.membershipId, {
        confirmPassword: transferValues.confirmPassword,
      });
      toast.success('Ownership transferred');
      setTransferValues({ membershipId: '', confirmPassword: '' });
      await Promise.all([loadMembers(), refreshOrgs?.()]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Ownership could not be transferred.'));
    } finally {
      setIsTransferringOwnership(false);
    }
  };

  const handleDeleteOrg = async (event) => {
    event.preventDefault();

    if (isDeleteDisabled) {
      return;
    }

    setIsDeletingOrg(true);

    try {
      const nextOrgs = removeOrgLocally?.(activeOrgId) || [];
      await organizationService.deleteOrg(activeOrgId, {
        confirmName: deleteValues.confirmName,
        confirmPassword: deleteValues.confirmPassword,
      });
      toast.success('Organization deleted');
      await refreshOrgs?.();
      navigate(nextOrgs.length > 0 ? '/app/dashboard' : '/create-org', { replace: true });
    } catch (error) {
      await refreshOrgs?.();
      toast.error(getErrorMessage(error, 'Organization could not be deleted.'));
    } finally {
      setIsDeletingOrg(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-cyan-300">
          {activeOrg?.name || 'Workspace'}
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-slate-50">Organization Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-slate-300">
          Update workspace identity, share member access, and handle owner-only organization controls.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
          <nav className="space-y-1" aria-label="Organization settings sections">
            {sectionLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-6">
          <SettingsSection
            id="general"
            icon={Building2}
            title="General"
            description="Admins can update the public workspace name, description, and logo."
          >
            {!canUpdateGeneral ? (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                You need an admin or owner role to update organization details.
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleGeneralSave}>
              <div>
                <FieldLabel htmlFor="orgName">Name</FieldLabel>
                <input
                  id="orgName"
                  type="text"
                  value={formValues.name}
                  onChange={(event) => setFormValues((currentValues) => ({ ...currentValues, name: event.target.value }))}
                  disabled={!canUpdateGeneral || isSavingGeneral}
                  minLength={2}
                  maxLength={80}
                  className={textInputClassName}
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <FieldLabel htmlFor="orgDescription">Description</FieldLabel>
                <textarea
                  id="orgDescription"
                  value={formValues.description}
                  onChange={(event) => setFormValues((currentValues) => ({ ...currentValues, description: event.target.value }))}
                  disabled={!canUpdateGeneral || isSavingGeneral}
                  maxLength={500}
                  rows={4}
                  className={textInputClassName}
                  placeholder="What does this workspace do?"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">{formValues.description.length}/500 characters</p>
              </div>

              <div>
                <FieldLabel htmlFor="orgLogo">Logo</FieldLabel>
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleLogoDrop}
                  className={`mt-2 rounded-3xl border border-dashed p-5 transition ${
                    isDraggingLogo
                      ? 'border-brand-400 bg-brand-50 dark:border-cyan-400 dark:bg-cyan-950/20'
                      : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-950'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200 dark:bg-slate-900 dark:ring-slate-700">
                      {logoPreviewUrl || formValues.logo ? (
                        <img src={logoPreviewUrl || formValues.logo} alt="Organization logo preview" className="h-full w-full object-cover" />
                      ) : (
                        <ImagePlus className="h-7 w-7 text-gray-400" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Drop a logo here or choose a file</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">PNG, JPG, or WebP images work best.</p>
                      <input
                        id="orgLogo"
                        type="file"
                        accept="image/*"
                        disabled={!canUpdateGeneral || isSavingGeneral}
                        onChange={(event) => setLogoFile(event.target.files?.[0])}
                        className="mt-3 block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-brand-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:file:bg-cyan-500 dark:file:text-slate-950 dark:hover:file:bg-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={isGeneralSaveDisabled} className={primaryButtonClassName}>
                  {isSavingGeneral ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  Save General
                </button>
              </div>
            </form>
          </SettingsSection>

          <SettingsSection id="members" icon={Users} title="Members" description="Invite teammates and manage roles from the Members page.">
            <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-gray-950 dark:text-slate-50">Member management</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Review active members, pending invites, and role changes.</p>
              </div>
              <Link to="/app/members" className={secondaryButtonClassName}>
                Open Members
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </SettingsSection>

          <SettingsSection id="slug" icon={LinkIcon} title="Slug & URL" description="These identifiers are generated by the platform and cannot be edited here.">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="orgSlug">Slug</FieldLabel>
                <input id="orgSlug" value={activeOrg?.slug || ''} readOnly className={textInputClassName} />
              </div>
              <div>
                <FieldLabel htmlFor="orgUrl">Workspace URL</FieldLabel>
                <input id="orgUrl" value={orgUrl} readOnly className={textInputClassName} />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            id="danger"
            icon={ShieldAlert}
            title="Danger Zone"
            description="Owner-only controls require an extra password confirmation before they run."
          >
            {!isOwner ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                Only the organization owner can transfer ownership or delete this organization.
              </div>
            ) : null}

            <div className="mt-5 grid gap-5">
              <form onSubmit={handleTransferOwnership} className="rounded-3xl border border-gray-200 p-5 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-1 h-5 w-5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-gray-950 dark:text-slate-50">Transfer Ownership</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      The selected member becomes owner and your role changes to admin.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="newOwner">New owner</FieldLabel>
                    <select
                      id="newOwner"
                      value={transferValues.membershipId}
                      disabled={!isOwner || isLoadingMembers || isTransferringOwnership}
                      onChange={(event) => setTransferValues((currentValues) => ({ ...currentValues, membershipId: event.target.value }))}
                      className={textInputClassName}
                    >
                      <option value="">{isLoadingMembers ? 'Loading members...' : 'Select a member'}</option>
                      {memberOptions.map((membership) => {
                        const memberUser = getMemberUser(membership);

                        return (
                          <option key={getRecordId(membership)} value={getRecordId(membership)}>
                            {getDisplayName(memberUser)} ({membership.role})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <FieldLabel htmlFor="transferPassword">Password confirmation</FieldLabel>
                    <input
                      id="transferPassword"
                      type="password"
                      value={transferValues.confirmPassword}
                      disabled={!isOwner || isTransferringOwnership}
                      onChange={(event) => setTransferValues((currentValues) => ({ ...currentValues, confirmPassword: event.target.value }))}
                      className={textInputClassName}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button type="submit" disabled={isTransferDisabled} className={primaryButtonClassName}>
                    {isTransferringOwnership ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    Transfer Ownership
                  </button>
                </div>
              </form>

              <form onSubmit={handleDeleteOrg} className="rounded-3xl border border-red-200 bg-red-50/60 p-5 dark:border-red-900/70 dark:bg-red-950/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 text-red-600 dark:text-red-300" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-red-950 dark:text-red-100">Delete Organization</h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-200">
                      This removes the organization and related tenant data. Type the organization name and confirm your password.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="deleteName">Type "{activeOrg?.name || 'organization name'}"</FieldLabel>
                    <input
                      id="deleteName"
                      type="text"
                      value={deleteValues.confirmName}
                      disabled={!isOwner || isDeletingOrg}
                      onChange={(event) => setDeleteValues((currentValues) => ({ ...currentValues, confirmName: event.target.value }))}
                      className={textInputClassName}
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="deletePassword">Password confirmation</FieldLabel>
                    <input
                      id="deletePassword"
                      type="password"
                      value={deleteValues.confirmPassword}
                      disabled={!isOwner || isDeletingOrg}
                      onChange={(event) => setDeleteValues((currentValues) => ({ ...currentValues, confirmPassword: event.target.value }))}
                      className={textInputClassName}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button type="submit" disabled={isDeleteDisabled} className={dangerButtonClassName}>
                    {isDeletingOrg ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    Delete Organization
                  </button>
                </div>
              </form>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};
