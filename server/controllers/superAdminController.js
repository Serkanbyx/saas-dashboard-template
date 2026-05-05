import mongoose from 'mongoose';
import ActivityLog from '../models/ActivityLog.js';
import BillingRecord from '../models/BillingRecord.js';
import Invitation from '../models/Invitation.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { sendOrgSuspendedEmail } from '../services/emailService.js';
import { logActivity } from '../services/activityService.js';
import { createNotificationSafely } from '../services/notificationService.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const plans = ['free', 'pro'];
const platformRoles = ['user', 'superadmin'];
const searchableUserFields = ['name', 'email'];

const getPagination = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 50);

  return { page, limit };
};

const getTotalPages = (total, limit) => Math.ceil(total / limit);

const getBooleanFilter = (value) => {
  if (value === undefined) return undefined;
  return value === true || value === 'true';
};

const isSameId = (firstId, secondId) => firstId?.toString() === secondId?.toString();

const getThirtyDaysAgo = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const getTwentyFourHoursAgo = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

const getDateKey = (date) => date.toISOString().slice(0, 10);

const getDailySeries = ({ rows, startDate, days }) => {
  const countsByDate = rows.reduce((counts, row) => counts.set(row._id, row.count), new Map());

  return Array.from({ length: days }, (_item, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    const dateKey = getDateKey(date);

    return {
      date: dateKey,
      value: countsByDate.get(dateKey) || 0,
    };
  });
};

const getSearchFilter = (search, fields) => {
  if (!search) return {};

  const regex = new RegExp(escapeRegex(search), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

const getOrgFilter = (query) => {
  const filter = {
    ...getSearchFilter(query.search, ['name', 'slug']),
  };
  const isDeleted = getBooleanFilter(query.isDeleted);

  if (plans.includes(query.plan)) {
    filter.plan = query.plan;
  }

  if (isDeleted !== undefined) {
    filter.isDeleted = isDeleted;
  }

  return filter;
};

const getUserFilter = (query) => {
  const filter = {
    ...getSearchFilter(query.search, searchableUserFields),
  };
  const isActive = getBooleanFilter(query.isActive);

  if (platformRoles.includes(query.platformRole)) {
    filter.platformRole = query.platformRole;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  return filter;
};

const mapCountsById = (rows) =>
  rows.reduce((countsById, row) => {
    countsById.set(row._id.toString(), row.count);
    return countsById;
  }, new Map());

const getMemberCountsByOrgId = async (orgIds) => {
  if (orgIds.length === 0) return new Map();

  const rows = await Membership.aggregate([
    { $match: { orgId: { $in: orgIds } } },
    { $group: { _id: '$orgId', count: { $sum: 1 } } },
  ]);

  return mapCountsById(rows);
};

const getMembershipCountsByUserId = async (userIds) => {
  if (userIds.length === 0) return new Map();

  const rows = await Membership.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);

  return mapCountsById(rows);
};

const getNormalizedPlanBreakdown = (rows) =>
  plans.reduce(
    (breakdown, plan) => ({
      ...breakdown,
      [plan]: rows.find((row) => row._id === plan)?.count || 0,
    }),
    {},
  );

const logSuperAdminAction = ({ orgId, actorId, action, targetType, targetId, metadata = {} }) =>
  logActivity({
    orgId,
    actorId,
    action,
    targetType,
    targetId,
    metadata: {
      ...metadata,
      actorType: 'superadmin',
    },
  });

const deleteOrgCascade = async ({ orgId, session }) => {
  await Promise.all([
    Membership.deleteMany({ orgId }).session(session),
    Invitation.deleteMany({ orgId }).session(session),
    Notification.deleteMany({ orgId }).session(session),
    BillingRecord.deleteMany({ orgId }).session(session),
    ActivityLog.deleteMany({ orgId }).session(session),
    Organization.deleteOne({ _id: orgId }).session(session),
  ]);
};

const assertCanUpdateUser = async ({ currentUser, targetUser, updates }) => {
  if (isSameId(currentUser._id, targetUser._id) && Object.keys(updates).length > 0) {
    throw createHttpError(400, 'Cannot update your own super admin account');
  }

  const activeSuperAdminCount = await User.countDocuments({ platformRole: 'superadmin', isActive: true });
  const nextRole = updates.platformRole ?? targetUser.platformRole;
  const nextIsActive = updates.isActive ?? targetUser.isActive;
  const demotesSuperAdmin = targetUser.platformRole === 'superadmin' && nextRole !== 'superadmin';
  const deactivatesSuperAdmin = targetUser.platformRole === 'superadmin' && targetUser.isActive && !nextIsActive;

  if ((demotesSuperAdmin || deactivatesSuperAdmin) && activeSuperAdminCount <= 1) {
    throw createHttpError(400, 'Cannot demote or deactivate the last super admin');
  }
};

const pickUserStatusUpdates = (body) => {
  const updates = {};

  if (Object.hasOwn(body, 'isActive')) {
    updates.isActive = body.isActive;
  }

  if (Object.hasOwn(body, 'platformRole')) {
    updates.platformRole = body.platformRole;
  }

  return updates;
};

export const getPlatformStats = async (_req, res, next) => {
  try {
    const thirtyDaysAgo = getThirtyDaysAgo();
    const twentyFourHoursAgo = getTwentyFourHoursAgo();
    const signupTrendStart = new Date();
    signupTrendStart.setUTCDate(signupTrendStart.getUTCDate() - 29);
    signupTrendStart.setUTCHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalOrgs,
      totalMemberships,
      activeSubscriptions,
      planRows,
      signupsLast30d,
      signupRows,
      activityLast24h,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments(),
      Membership.countDocuments(),
      Organization.countDocuments({ plan: 'pro', isDeleted: false }),
      Organization.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$plan', count: { $sum: 1 } } }]),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.aggregate([
        { $match: { createdAt: { $gte: signupTrendStart } } },
        {
          $group: {
            _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ActivityLog.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
      ActivityLog.find()
        .populate({ path: 'actorId', select: 'name email avatar' })
        .populate({ path: 'orgId', select: 'name slug plan isDeleted' })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalOrgs,
        totalMemberships,
        activeSubscriptions,
        planBreakdown: getNormalizedPlanBreakdown(planRows),
        signupsLast30d,
        signupTrend: getDailySeries({ rows: signupRows, startDate: signupTrendStart, days: 30 }),
        activityLast24h,
        recentActivity,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const listAllOrgs = async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query);
    const filter = getOrgFilter(req.query);

    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .populate({ path: 'ownerId', select: 'name email avatar isActive platformRole' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Organization.countDocuments(filter),
    ]);
    const memberCountsByOrgId = await getMemberCountsByOrgId(organizations.map((organization) => organization._id));

    return res.json({
      success: true,
      data: {
        organizations: organizations.map((organization) => ({
          ...organization,
          memberCount: memberCountsByOrgId.get(organization._id.toString()) || 0,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: getTotalPages(total, limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrgDetails = async (req, res, next) => {
  try {
    const orgId = req.params.orgId;
    const organization = await Organization.findById(orgId)
      .populate({ path: 'ownerId', select: 'name email avatar isActive platformRole' })
      .lean();

    if (!organization) {
      throw createHttpError(404, 'Organization not found');
    }

    const [members, recentActivity, billingRecords] = await Promise.all([
      Membership.find({ orgId })
        .populate({ path: 'userId', select: 'name email avatar isActive platformRole' })
        .sort({ joinedAt: -1 })
        .lean(),
      ActivityLog.find({ orgId })
        .populate({ path: 'actorId', select: 'name email avatar' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      BillingRecord.find({ orgId })
        .populate({ path: 'actorId', select: 'name email avatar' })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        organization,
        members,
        recentActivity,
        billing: {
          latestRecord: billingRecords[0] || null,
          records: billingRecords,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const suspendOrg = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.orgId).populate({
      path: 'ownerId',
      select: 'name email',
    });

    if (!organization) {
      throw createHttpError(404, 'Organization not found');
    }

    organization.isDeleted = true;
    organization.deletedAt = new Date();
    await organization.save();

    const reason = req.body.reason.trim();

    await Promise.all([
      sendOrgSuspendedEmail({
        to: organization.ownerId.email,
        ownerName: organization.ownerId.name,
        orgName: organization.name,
        reason,
      }),
      createNotificationSafely({
        userId: organization.ownerId._id,
        orgId: organization._id,
        type: 'org_suspended',
        title: 'Organization suspended',
        message: `${organization.name} has been suspended. Reason: ${reason}`,
        link: '/organizations',
        metadata: { reason },
      }),
      logSuperAdminAction({
        orgId: organization._id,
        actorId: req.user._id,
        action: 'superadmin.org_suspended',
        targetType: 'organization',
        targetId: organization._id,
        metadata: { reason, orgName: organization.name },
      }),
    ]);

    return res.json({ success: true, data: { organization } });
  } catch (error) {
    return next(error);
  }
};

export const restoreOrg = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.orgId);

    if (!organization) {
      throw createHttpError(404, 'Organization not found');
    }

    organization.isDeleted = false;
    organization.deletedAt = undefined;
    await organization.save();

    await logSuperAdminAction({
      orgId: organization._id,
      actorId: req.user._id,
      action: 'superadmin.org_restored',
      targetType: 'organization',
      targetId: organization._id,
      metadata: { orgName: organization.name },
    });

    return res.json({ success: true, data: { organization } });
  } catch (error) {
    return next(error);
  }
};

export const forceDeleteOrg = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const organization = await Organization.findById(req.params.orgId);

    if (!organization) {
      throw createHttpError(404, 'Organization not found');
    }

    if (req.body.confirmName !== organization.name) {
      throw createHttpError(400, 'Organization name confirmation does not match');
    }

    await session.withTransaction(async () => {
      await deleteOrgCascade({ orgId: organization._id, session });
    });

    await logSuperAdminAction({
      orgId: organization._id,
      actorId: req.user._id,
      action: 'superadmin.org_force_deleted',
      targetType: 'organization',
      targetId: organization._id,
      metadata: { orgName: organization.name },
    });

    return res.json({ success: true, message: 'Organization permanently deleted' });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

export const listAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query);
    const filter = getUserFilter(req.query);

    const [users, total, activeSuperAdminCount] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.countDocuments({ platformRole: 'superadmin', isActive: true }),
    ]);
    const membershipCountsByUserId = await getMembershipCountsByUserId(users.map((user) => user._id));

    return res.json({
      success: true,
      data: {
        users: users.map((user) => ({
          ...user,
          membershipCount: membershipCountsByUserId.get(user._id.toString()) || 0,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: getTotalPages(total, limit),
        },
        activeSuperAdminCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserMemberships = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('name email avatar platformRole isActive').lean();

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const memberships = await Membership.find({ userId: req.params.userId })
      .populate({ path: 'orgId', select: 'name slug plan isDeleted createdAt' })
      .sort({ joinedAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        user,
        memberships,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const updates = pickUserStatusUpdates(req.body);

    if (Object.keys(updates).length === 0) {
      throw createHttpError(400, 'At least one status field is required');
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    await assertCanUpdateUser({ currentUser: req.user, targetUser: user, updates });

    const previousStatus = {
      isActive: user.isActive,
      platformRole: user.platformRole,
    };

    Object.assign(user, updates);
    await user.save();

    await logSuperAdminAction({
      actorId: req.user._id,
      action: 'superadmin.user_updated',
      targetType: 'user',
      targetId: user._id,
      metadata: {
        previousStatus,
        updates,
        targetEmail: user.email,
      },
    });

    return res.json({ success: true, data: { user } });
  } catch (error) {
    return next(error);
  }
};
