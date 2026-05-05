import { useCallback } from 'react';
import { useOrg } from '../hooks/useOrg';

const ROLE_ORDER = {
  member: 1,
  admin: 2,
  owner: 3,
};

const PERMISSIONS = {
  'activity.view': ['owner', 'admin', 'member'],
  'billing.view': ['owner'],
  'members.view': ['owner', 'admin', 'member'],
  'settings.manage': ['owner', 'admin'],
};

export const getMembershipRole = (membership) => membership?.role || 'member';

export const hasMinimumRole = (membership, requiredRole) => {
  const currentRoleRank = ROLE_ORDER[getMembershipRole(membership)] || 0;
  const requiredRoleRank = ROLE_ORDER[requiredRole] || 0;

  return currentRoleRank >= requiredRoleRank;
};

export const can = (membership, permission) => {
  const allowedRoles = PERMISSIONS[permission];

  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(getMembershipRole(membership));
};

export const usePermissions = () => {
  const { currentMembership } = useOrg() || {};

  const canAccess = useCallback((permission) => can(currentMembership, permission), [currentMembership]);
  const hasRole = useCallback((requiredRole) => hasMinimumRole(currentMembership, requiredRole), [currentMembership]);

  return {
    can: canAccess,
    hasRole,
    role: getMembershipRole(currentMembership),
  };
};
