import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as organizationService from '../services/organizationService';

const ACTIVE_ORG_STORAGE_KEY = 'saas:activeOrgId';

export const OrgContext = createContext(null);

const getStoredActiveOrgId = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
};

const getOrgId = (org) => org?._id || org?.id;

export const OrgProvider = ({ children }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSwitchingOrg, setIsSwitchingOrg] = useState(false);

  const applyActiveOrg = useCallback((organizations, preferredOrgId = getStoredActiveOrgId()) => {
    const nextActiveOrg =
      organizations.find((organization) => getOrgId(organization) === preferredOrgId) || organizations[0] || null;

    if (nextActiveOrg) {
      window.localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, getOrgId(nextActiveOrg));
    } else {
      window.localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }

    setActiveOrg(nextActiveOrg);
    return nextActiveOrg;
  }, []);

  const refreshOrgs = useCallback(async () => {
    if (!token || !user) {
      setOrgs([]);
      setActiveOrg(null);
      setLoading(false);
      setIsSwitchingOrg(false);
      return [];
    }

    setLoading(true);

    try {
      const response = await organizationService.getMyOrgs();
      const organizations = response.data?.data?.organizations || [];

      setOrgs(organizations);
      applyActiveOrg(organizations);

      return organizations;
    } finally {
      setLoading(false);
    }
  }, [applyActiveOrg, token, user]);

  const createOrg = useCallback(
    async (payload) => {
      const response = await organizationService.createOrg(payload);
      const organization = response.data?.data?.organization;

      if (!organization) {
        return null;
      }

      const organizationWithRole = { ...organization, role: 'owner' };

      setOrgs((currentOrgs) => [organizationWithRole, ...currentOrgs]);
      applyActiveOrg([organizationWithRole], getOrgId(organizationWithRole));

      return organizationWithRole;
    },
    [applyActiveOrg],
  );

  const switchOrg = useCallback(
    async (orgId, organizationList = orgs) => {
      const nextActiveOrg = organizationList.find((organization) => getOrgId(organization) === orgId);

      if (!nextActiveOrg) {
        return null;
      }

      window.localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
      setActiveOrg(nextActiveOrg);

      setIsSwitchingOrg(true);

      try {
        const response = await organizationService.getMyOrgs();
        const organizations = response.data?.data?.organizations || [];

        setOrgs(organizations);
        return applyActiveOrg(organizations, orgId);
      } finally {
        setIsSwitchingOrg(false);
      }
    },
    [applyActiveOrg, orgs],
  );

  const replaceOrgLocally = useCallback((organization) => {
    const organizationId = getOrgId(organization);

    if (!organizationId) {
      return;
    }

    setOrgs((currentOrgs) =>
      currentOrgs.map((currentOrg) =>
        getOrgId(currentOrg) === organizationId
          ? {
              ...currentOrg,
              ...organization,
              role: organization.role || currentOrg.role,
            }
          : currentOrg,
      ),
    );
    setActiveOrg((currentOrg) =>
      currentOrg && getOrgId(currentOrg) === organizationId
        ? {
            ...currentOrg,
            ...organization,
            role: organization.role || currentOrg.role,
          }
        : currentOrg,
    );
  }, []);

  const removeOrgLocally = useCallback(
    (orgId) => {
      const nextOrgs = orgs.filter((organization) => getOrgId(organization) !== orgId);

      setOrgs(nextOrgs);
      applyActiveOrg(nextOrgs, null);

      return nextOrgs;
    },
    [applyActiveOrg, orgs],
  );

  const setActiveOrgFirstAvailable = useCallback(() => applyActiveOrg(orgs, null), [applyActiveOrg, orgs]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    refreshOrgs();
  }, [authLoading, refreshOrgs]);

  const currentMembership = useMemo(() => {
    if (!activeOrg) {
      return null;
    }

    return {
      orgId: getOrgId(activeOrg),
      role: activeOrg.role,
    };
  }, [activeOrg]);

  const value = useMemo(
    () => ({
      orgs,
      activeOrg,
      currentMembership,
      isSwitchingOrg,
      loading,
      switchOrg,
      refreshOrgs,
      createOrg,
      replaceOrgLocally,
      removeOrgLocally,
      setActiveOrgFirstAvailable,
    }),
    [
      activeOrg,
      createOrg,
      currentMembership,
      isSwitchingOrg,
      loading,
      orgs,
      refreshOrgs,
      removeOrgLocally,
      replaceOrgLocally,
      setActiveOrgFirstAvailable,
      switchOrg,
    ],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};
