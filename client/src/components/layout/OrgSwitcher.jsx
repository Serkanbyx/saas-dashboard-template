import { Building2, Check, Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../hooks/useOrg';

const getOrgId = (org) => org?._id || org?.id;

const getInitials = (name = 'Organization') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const OrgLogo = ({ org }) => {
  const orgName = org?.name || 'Organization';

  if (org?.logo) {
    return <img src={org.logo} alt="" className="h-9 w-9 rounded-xl object-cover" />;
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700 dark:bg-slate-800 dark:text-brand-50">
      {getInitials(orgName) || <Building2 className="h-4 w-4" aria-hidden="true" />}
    </span>
  );
};

export const OrgSwitcher = () => {
  const navigate = useNavigate();
  const { activeOrg, isSwitchingOrg, orgs = [], switchOrg } = useOrg() || {};
  const [isOpen, setIsOpen] = useState(false);
  const activeOrgId = getOrgId(activeOrg);

  const handleSwitchOrg = async (orgId) => {
    setIsOpen(false);

    try {
      await switchOrg?.(orgId);
    } catch (_error) {
      toast.error('Organization could not be switched.');
    }
  };

  const handleCreateOrg = () => {
    setIsOpen(false);
    navigate('/create-org');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        disabled={isSwitchingOrg}
        className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500 dark:hover:bg-slate-800"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="shrink-0">
          <OrgLogo org={activeOrg} />
        </span>
        <span className="block min-w-0 flex-1 overflow-hidden">
          <span
            className="block truncate text-sm font-semibold text-gray-900 dark:text-slate-100"
            title={activeOrg?.name || ''}
          >
            {activeOrg?.name || 'Select organization'}
          </span>
          <span className="block truncate text-xs capitalize text-gray-500 dark:text-slate-400">
            {activeOrg?.role || 'No role'}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
          role="menu"
        >
          <div className="max-h-72 overflow-y-auto py-2">
            {orgs.length > 0 ? (
              orgs.map((org) => {
                const orgId = getOrgId(org);
                const isActive = orgId === activeOrgId;

                return (
                  <button
                    key={orgId}
                    type="button"
                    onClick={() => handleSwitchOrg(orgId)}
                    disabled={isSwitchingOrg || isActive}
                    className="flex w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
                    role="menuitem"
                  >
                    <span className="shrink-0">
                      <OrgLogo org={org} />
                    </span>
                    <span className="block min-w-0 flex-1 overflow-hidden">
                      <span className="block truncate font-medium text-gray-900 dark:text-slate-100" title={org.name}>
                        {org.name}
                      </span>
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                        {org.role || 'member'}
                      </span>
                    </span>
                    {isActive ? <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-sm text-gray-500 dark:text-slate-400">No organizations found.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateOrg}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 focus:bg-brand-50 focus:outline-none dark:border-slate-800 dark:text-cyan-300 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
            role="menuitem"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create new organization
          </button>
        </div>
      ) : null}
    </div>
  );
};
