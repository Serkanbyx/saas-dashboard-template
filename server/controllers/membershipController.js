import mongoose from 'mongoose';
import Invitation from '../models/Invitation.js';
import Membership from '../models/Membership.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { logActivity } from '../services/activityService.js';
import { emitToOrg } from '../services/socketService.js';
import { ORG_ROLES } from '../utils/constants.js';

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isSameId = (left, right) => left?.toString() === right?.toString();

const createEmptyMemberCounts = () => ({
  total: 0,
  owners: 0,
  admins: 0,
  members: 0,
  pending: 0,
});

const normalizeMemberCounts = (roleCounts, pending) =>
  roleCounts.reduce(
    (counts, roleCount) => {
      const roleKey = `${roleCount._id}s`;
      if (roleKey in counts) {
        counts[roleKey] = roleCount.count;
      }

      counts.total += roleCount.count;
      return counts;
    },
    { ...createEmptyMemberCounts(), pending },
  );

const markExpiredPendingInvitations = (orgId) =>
  Invitation.updateMany(
    {
      orgId,
      status: 'pending',
      expiresAt: { $lte: new Date() },
    },
    { status: 'expired' },
  );

const getMembershipInOrg = async (membershipId, orgId, session) => {
  const query = Membership.findOne({ _id: membershipId, orgId });
  if (session) query.session(session);

  const membership = await query;

  if (!membership) {
    throw createHttpError(404, 'Membership not found');
  }

  return membership;
};

const validateRoleUpdate = ({ currentUserId, currentRole, targetMembership, nextRole }) => {
  if (!ORG_ROLES.includes(nextRole)) {
    throw createHttpError(400, 'Invalid role');
  }

  if (targetMembership.role === 'owner') {
    throw createHttpError(400, 'Owner role cannot be changed');
  }

  if (nextRole === 'owner') {
    throw createHttpError(400, 'Use ownership transfer to promote an owner');
  }

  if (isSameId(targetMembership.userId, currentUserId)) {
    throw createHttpError(400, 'You cannot change your own role');
  }

  if (currentRole === 'admin' && targetMembership.role === 'admin' && nextRole !== 'admin') {
    throw createHttpError(403, 'Admins cannot demote other admins');
  }
};

const validateRemoval = ({ currentUserId, currentRole, targetMembership }) => {
  if (targetMembership.role === 'owner') {
    throw createHttpError(400, 'Owner cannot be removed');
  }

  if (isSameId(targetMembership.userId, currentUserId)) {
    throw createHttpError(400, 'Use leave organization instead');
  }

  if (currentRole === 'admin' && targetMembership.role === 'admin') {
    throw createHttpError(403, 'Admins cannot remove other admins');
  }
};

export const listMembers = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
    const filter = { orgId: req.orgId };
    const search = req.query.search?.trim();

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      const users = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');

      filter.userId = { $in: users.map((user) => user._id) };
    }

    const [memberships, total] = await Promise.all([
      Membership.find(filter)
        .populate({ path: 'userId', select: 'name email avatar isActive' })
        .sort({ role: 1, joinedAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Membership.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        memberships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getMembersOverview = async (req, res, next) => {
  try {
    await markExpiredPendingInvitations(req.orgId);

    const invitationFilter = { orgId: req.orgId, status: 'pending' };

    const [members, pendingInvitations, roleCounts, pendingCount] = await Promise.all([
      Membership.find({ orgId: req.orgId })
        .populate({ path: 'userId', select: 'name email avatar' })
        .sort({ role: 1, joinedAt: 1 }),
      Invitation.find(invitationFilter)
        .select('-token -__v')
        .populate({ path: 'invitedBy', select: 'name email avatar' })
        .sort({ createdAt: -1 }),
      Membership.aggregate([
        { $match: { orgId: req.orgId } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Invitation.countDocuments(invitationFilter),
    ]);

    return res.json({
      success: true,
      data: {
        members,
        pendingInvitations,
        counts: normalizeMemberCounts(roleCounts, pendingCount),
        seats: {
          used: req.org.seatsUsed,
          limit: req.org.seatLimit,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const membership = await getMembershipInOrg(req.params.membershipId, req.orgId);

    validateRoleUpdate({
      currentUserId: req.user._id,
      currentRole: req.membership.role,
      targetMembership: membership,
      nextRole: role,
    });

    const previousRole = membership.role;
    membership.role = role;
    await membership.save();

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'member.role_changed',
      targetType: 'membership',
      targetId: membership._id,
      metadata: {
        targetUserId: membership.userId,
        previousRole,
        role,
      },
    });

    emitToOrg(req.orgId, 'membership:updated', { membershipId: membership._id, role });

    return res.json({ success: true, data: { membership } });
  } catch (error) {
    return next(error);
  }
};

export const removeMember = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let removedMembership;

    await session.withTransaction(async () => {
      removedMembership = await getMembershipInOrg(req.params.membershipId, req.orgId, session);

      validateRemoval({
        currentUserId: req.user._id,
        currentRole: req.membership.role,
        targetMembership: removedMembership,
      });

      await Membership.deleteOne({ _id: removedMembership._id }).session(session);
      await Organization.updateOne({ _id: req.orgId }, { $inc: { seatsUsed: -1 } }).session(session);
    });

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'member.removed',
      targetType: 'membership',
      targetId: removedMembership._id,
      metadata: {
        targetUserId: removedMembership.userId,
        role: removedMembership.role,
      },
    });

    emitToOrg(req.orgId, 'membership:removed', { membershipId: removedMembership._id });

    return res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

export const leaveOrg = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (req.membership.role === 'owner') {
        throw createHttpError(400, 'Owner cannot leave before transferring ownership');
      }

      await Membership.deleteOne({ _id: req.membership._id }).session(session);
      await Organization.updateOne({ _id: req.orgId }, { $inc: { seatsUsed: -1 } }).session(session);
    });

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'member.left',
      targetType: 'membership',
      targetId: req.membership._id,
      metadata: { userId: req.user._id },
    });

    emitToOrg(req.orgId, 'membership:left', { membershipId: req.membership._id, userId: req.user._id });

    return res.json({ success: true, message: 'Left organization successfully' });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};

export const transferOwnership = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { confirmPassword } = req.body;
    const owner = await User.findById(req.user._id).select('+password');

    if (!owner || !(await owner.comparePassword(confirmPassword))) {
      throw createHttpError(400, 'Password confirmation failed');
    }

    let newOwnerMembership;

    await session.withTransaction(async () => {
      newOwnerMembership = await getMembershipInOrg(req.params.membershipId, req.orgId, session);

      if (isSameId(newOwnerMembership.userId, req.user._id)) {
        throw createHttpError(400, 'You already own this organization');
      }

      const currentOwnerMembership = await Membership.findOne({
        userId: req.user._id,
        orgId: req.orgId,
        role: 'owner',
      }).session(session);

      if (!currentOwnerMembership) {
        throw createHttpError(403, 'Only the current owner can transfer ownership');
      }

      newOwnerMembership.role = 'owner';
      currentOwnerMembership.role = 'admin';

      await Promise.all([
        newOwnerMembership.save({ session }),
        currentOwnerMembership.save({ session }),
        Organization.updateOne({ _id: req.orgId }, { ownerId: newOwnerMembership.userId }).session(session),
      ]);
    });

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'ownership.transferred',
      targetType: 'organization',
      targetId: req.orgId,
      metadata: {
        previousOwnerId: req.user._id,
        newOwnerId: newOwnerMembership.userId,
        membershipId: newOwnerMembership._id,
      },
    });

    emitToOrg(req.orgId, 'membership:ownership_transferred', {
      membershipId: newOwnerMembership._id,
      newOwnerId: newOwnerMembership.userId,
    });

    return res.json({ success: true, data: { membership: newOwnerMembership } });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};
