import { useCallback } from 'react';
import { useOrg } from '../hooks/useOrg';

const ROLE_ORDER = {
  member: 1,
  admin: 2,
  owner: 3,
};

const PERMISSIONS = {
  'org:read': ['owner', 'admin', 'member'],
  'org:update': ['owner', 'admin'],
  'org:delete': ['owner'],
  'org:billing': ['owner'],
  'members:read': ['owner', 'admin', 'member'],
  'members:invite': ['owner', 'admin'],
  'members:update': ['owner', 'admin'],
  'members:remove': ['owner', 'admin'],
  'activity:read': ['owner', 'admin', 'member'],
  'notifications:read': ['owner', 'admin', 'member'],
  'search:read': ['owner', 'admin', 'member'],
};

const PERMISSION_ALIASES = {
  'activity.view': 'activity:read',
  'billing.view': 'org:billing',
  'members.view': 'members:read',
  'settings.manage': 'org:update',
};

export const getMembershipRole = (membership) => membership?.role || 'member';

export const hasMinimumRole = (membership, requiredRole) => {
  const currentRoleRank = ROLE_ORDER[getMembershipRole(membership)] || 0;
  const requiredRoleRank = ROLE_ORDER[requiredRole] || 0;

  return currentRoleRank >= requiredRoleRank;
};

export const can = (membership, permission) => {
  const permissionKey = PERMISSION_ALIASES[permission] || permission;
  const allowedRoles = PERMISSIONS[permissionKey];

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
