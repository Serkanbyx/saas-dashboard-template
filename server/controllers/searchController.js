import ActivityLog from '../models/ActivityLog.js';
import Invitation from '../models/Invitation.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const searchTypes = ['members', 'invitations', 'activities'];
const defaultLimit = 5;
const maxLimit = 10;

const getRequestedTypes = (types) => {
  if (!types) return searchTypes;

  const requestedTypes = String(types)
    .split(',')
    .map((type) => type.trim())
    .filter(Boolean);

  return searchTypes.filter((type) => requestedTypes.includes(type));
};

const getSearchLimit = (limit) => Math.min(Math.max(Number.parseInt(limit, 10) || defaultLimit, 1), maxLimit);

const createEmptyResults = (requestedTypes) =>
  requestedTypes.reduce((results, type) => {
    results[type] = [];
    return results;
  }, {});

const searchMembers = async ({ orgId, regex, limit }) => {
  const orgMemberships = await Membership.find({ orgId }).select('userId').lean();
  const orgUserIds = orgMemberships.map((membership) => membership.userId);

  if (!orgUserIds.length) return [];

  const users = await User.find({
    _id: { $in: orgUserIds },
    $or: [{ name: regex }, { email: regex }],
  })
    .select('_id')
    .lean();

  if (!users.length) return [];

  return Membership.find({ orgId, userId: { $in: users.map((user) => user._id) } })
    .populate({ path: 'userId', select: 'name email avatar' })
    .select('userId role')
    .sort({ role: 1, joinedAt: 1 })
    .limit(limit);
};

const searchInvitations = ({ orgId, regex, limit }) =>
  Invitation.find({ orgId, email: regex, status: 'pending' })
    .select('email role status createdAt expiresAt')
    .sort({ createdAt: -1 })
    .limit(limit);

const searchActivities = async ({ orgId, regex, limit }) => {
  const activities = await ActivityLog.find({
    orgId,
    $or: [{ action: regex }, { 'metadata.email': regex }],
  })
    .populate({ path: 'actorId', select: 'name email avatar' })
    .select('action actorId createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);

  return activities.map((activity) => ({
    _id: activity._id,
    action: activity.action,
    actor: activity.actorId,
    createdAt: activity.createdAt,
  }));
};

const searchHandlers = {
  members: searchMembers,
  invitations: searchInvitations,
  activities: searchActivities,
};

export const globalSearch = async (req, res, next) => {
  try {
    const query = String(req.query.q).trim();
    const regex = new RegExp(escapeRegex(query), 'i');
    const limit = getSearchLimit(req.query.limit);
    const requestedTypes = getRequestedTypes(req.query.types);
    const resultEntries = await Promise.all(
      requestedTypes.map(async (type) => [
        type,
        await searchHandlers[type]({
          orgId: req.orgId,
          regex,
          limit,
        }),
      ]),
    );

    const results = {
      ...createEmptyResults(requestedTypes),
      ...Object.fromEntries(resultEntries),
    };
    const totals = Object.fromEntries(requestedTypes.map((type) => [type, results[type].length]));

    return res.json({
      success: true,
      data: {
        query,
        results,
        totals,
      },
    });
  } catch (error) {
    return next(error);
  }
};
