export const ORG_ROLES = ['owner', 'admin', 'member'];

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    seatLimit: 5,
    features: ['Up to 5 members', 'Basic analytics', 'Community support'],
  },
  pro: {
    name: 'Pro',
    price: 29,
    currency: 'USD',
    seatLimit: 50,
    features: [
      'Up to 50 members',
      'Advanced analytics',
      'Priority support',
      'Activity export',
      'Custom branding',
    ],
  },
};

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
