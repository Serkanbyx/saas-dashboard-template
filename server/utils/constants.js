export const ORG_ROLES = ['owner', 'admin', 'member'];

export const PERMISSIONS = {
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
