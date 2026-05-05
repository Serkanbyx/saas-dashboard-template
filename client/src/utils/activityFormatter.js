export const ACTIVITY_ACTIONS = [
  'org.created',
  'org.updated',
  'org.deleted',
  'org.logo_changed',
  'member.invited',
  'member.joined',
  'member.role_changed',
  'member.removed',
  'member.left',
  'invitation.revoked',
  'invitation.resent',
  'billing.plan_changed',
  'billing.payment_recorded',
  'ownership.transferred',
  'superadmin.org_suspended',
  'superadmin.org_restored',
  'superadmin.org_force_deleted',
  'superadmin.user_updated',
];

const formatActionLabel = (action) =>
  (action || 'activity.updated')
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replaceAll('_', ' '))
    .join(' ');

const formatValue = (value, fallback) => value || fallback;

const formatRole = (role) => formatValue(role, 'member');

const formatPlan = (plan) => formatValue(plan, 'free');

const getActorName = (log) => log?.actorId?.name || log?.actorId?.email || 'Someone';

const getTargetName = (metadata = {}) =>
  metadata.targetName || metadata.targetEmail || metadata.email || metadata.orgName || metadata.name || 'someone';

export const activityActionOptions = ACTIVITY_ACTIONS.map((action) => ({
  label: formatActionLabel(action),
  value: action,
}));

export const formatActivity = (log) => {
  const actor = getActorName(log);
  const metadata = log?.metadata || {};

  switch (log?.action) {
    case 'org.created':
      return `${actor} created ${formatValue(metadata.name || metadata.orgName, 'the organization')}`;
    case 'org.updated':
      return `${actor} updated organization settings`;
    case 'org.deleted':
      return `${actor} deleted ${formatValue(metadata.orgName || metadata.name, 'the organization')}`;
    case 'org.logo_changed':
      return `${actor} updated the organization logo`;
    case 'member.invited':
      return `${actor} invited ${formatValue(metadata.email, 'a teammate')} as ${formatRole(metadata.role)}`;
    case 'member.joined':
      return `${actor} joined the organization as ${formatRole(metadata.role)}`;
    case 'member.role_changed':
      return `${actor} changed ${getTargetName(metadata)}'s role to ${formatRole(metadata.newRole || metadata.role)}`;
    case 'member.removed':
      return `${actor} removed ${getTargetName(metadata)} from the organization`;
    case 'member.left':
      return `${actor} left the organization`;
    case 'invitation.revoked':
      return `${actor} revoked the invitation for ${formatValue(metadata.email, 'a teammate')}`;
    case 'invitation.resent':
      return `${actor} resent the invitation for ${formatValue(metadata.email, 'a teammate')}`;
    case 'billing.plan_changed':
      return `${actor} changed the plan from ${formatPlan(metadata.previousPlan)} to ${formatPlan(metadata.newPlan)}`;
    case 'billing.payment_recorded':
      return `${actor} recorded a billing payment`;
    case 'ownership.transferred':
      return `${actor} transferred ownership to ${getTargetName({ ...metadata, targetName: metadata.newOwnerName })}`;
    case 'superadmin.org_suspended':
      return `${actor} suspended ${formatValue(metadata.orgName, 'an organization')}`;
    case 'superadmin.org_restored':
      return `${actor} restored ${formatValue(metadata.orgName, 'an organization')}`;
    case 'superadmin.org_force_deleted':
      return `${actor} permanently deleted ${formatValue(metadata.orgName, 'an organization')}`;
    case 'superadmin.user_updated':
      return `${actor} updated ${formatValue(metadata.targetEmail, 'a user')}`;
    default:
      return `${actor} performed ${formatActionLabel(log?.action).toLowerCase()}`;
  }
};
