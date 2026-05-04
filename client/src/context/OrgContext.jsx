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
      return [];
    }

    setLoading(true);

    try {
      const response = await organizationService.getMyOrgs();
      const organizations = response.data?.data?.organizations || [];

      setOrgs(organizations);
      applyActiveOrg(organizations);

      if (organizations.length === 0 && window.location.pathname !== '/create-org') {
        window.location.assign('/create-org');
      }

      return organizations;
    } finally {
      setLoading(false);
    }
  }, [applyActiveOrg, token, user]);

  const switchOrg = useCallback(
    (orgId) => {
      const nextActiveOrg = orgs.find((organization) => getOrgId(organization) === orgId);

      if (!nextActiveOrg) {
        return null;
      }

      window.localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, orgId);
      setActiveOrg(nextActiveOrg);

      return nextActiveOrg;
    },
    [orgs],
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
      loading,
      switchOrg,
      refreshOrgs,
      setActiveOrgFirstAvailable,
    }),
    [activeOrg, currentMembership, loading, orgs, refreshOrgs, setActiveOrgFirstAvailable, switchOrg],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
};
