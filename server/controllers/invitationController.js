import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import env from '../config/env.js';
import Invitation from '../models/Invitation.js';
import Membership from '../models/Membership.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { logActivity } from '../services/activityService.js';
import { sendInvitationEmail, sendWelcomeEmail } from '../services/emailService.js';
import { createNotificationSafely, createOrgNotifications } from '../services/notificationService.js';
import { emitToOrg } from '../services/socketService.js';

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const invitationDurationMs = 7 * 24 * 60 * 60 * 1000;

const getExpirationDate = () => new Date(Date.now() + invitationDurationMs);

const getAcceptUrl = (token) => {
  const acceptUrl = new URL('/invitations/accept', env.CLIENT_URL);
  acceptUrl.searchParams.set('token', token);
  return acceptUrl.toString();
};

const serializeInvitation = (invitation) => {
  const invitationObject = invitation.toObject ? invitation.toObject() : invitation;
  const { token, ...safeInvitation } = invitationObject;

  return safeInvitation;
};

const expireInvitationIfNeeded = async (invitation, session) => {
  if (invitation.status !== 'pending' || invitation.expiresAt > new Date()) {
    return false;
  }

  invitation.status = 'expired';
  await invitation.save({ session });
  return true;
};

const getPendingInvitationInOrg = async (invitationId, orgId) => {
  const invitation = await Invitation.findOne({ _id: invitationId, orgId });

  if (!invitation) {
    throw createHttpError(404, 'Invitation not found');
  }

  if (await expireInvitationIfNeeded(invitation)) {
    throw createHttpError(400, 'Invitation has expired');
  }

  if (invitation.status !== 'pending') {
    throw createHttpError(400, 'Only pending invitations can be updated');
  }

  return invitation;
};

const ensureInviteeIsNotMember = async ({ email, orgId, session }) => {
  const userQuery = User.findOne({ email }).select('_id');
  if (session) userQuery.session(session);

  const user = await userQuery;
  if (!user) return;

  const membershipQuery = Membership.findOne({ userId: user._id, orgId }).select('_id');
  if (session) membershipQuery.session(session);

  const membership = await membershipQuery;
  if (membership) {
    throw createHttpError(400, 'Email already belongs to an organization member');
  }
};

const markExpiredPendingInvitations = (filter, session) => {
  const query = Invitation.updateMany(
    {
      ...filter,
      status: 'pending',
      expiresAt: { $lte: new Date() },
    },
    { status: 'expired' },
  );

  return session ? query.session(session) : query;
};

export const createInvitation = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const email = req.body.email;
    const role = req.body.role || 'member';
    let invitation;

    await session.withTransaction(async () => {
      await markExpiredPendingInvitations({ email, orgId: req.orgId }, session);
      await ensureInviteeIsNotMember({ email, orgId: req.orgId, session });

      if (req.org.seatsUsed >= req.org.seatLimit) {
        throw createHttpError(400, 'Seat limit reached');
      }

      const existingPendingInvite = await Invitation.findOne({
        email,
        orgId: req.orgId,
        status: 'pending',
      }).session(session);

      if (existingPendingInvite) {
        throw createHttpError(400, 'Pending invitation already exists');
      }

      [invitation] = await Invitation.create(
        [
          {
            email,
            orgId: req.orgId,
            role,
            token: uuidv4(),
            invitedBy: req.user._id,
            expiresAt: getExpirationDate(),
          },
        ],
        { session },
      );
    });

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'member.invited',
      targetType: 'invitation',
      targetId: invitation._id,
      metadata: {
        email: invitation.email,
        role: invitation.role,
      },
    });

    await sendInvitationEmail({
      to: invitation.email,
      inviterName: req.user.name,
      orgName: req.org.name,
      role: invitation.role,
      acceptUrl: getAcceptUrl(invitation.token),
      expiresAt: invitation.expiresAt,
    });

    const invitedUser = await User.findOne({ email: invitation.email }).select('_id');
    if (invitedUser) {
      await createNotificationSafely({
        userId: invitedUser._id,
        orgId: req.orgId,
        type: 'invite_received',
        title: 'New organization invitation',
        message: `${req.user.name} invited you to join ${req.org.name}.`,
        link: '/invitations',
        metadata: {
          invitationId: invitation._id,
          role: invitation.role,
        },
      });
    }

    emitToOrg(req.orgId, 'invitation:created', {
      invitationId: invitation._id,
      email: invitation.email,
      role: invitation.role,
    });

    return res.status(201).json({ success: true, data: { invitation: serializeInvitation(invitation) } });
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(400, 'Pending invitation already exists'));
    }

    return next(error);
  } finally {
    await session.endSession();
  }
};

export const listInvitations = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
    const filter = { orgId: req.orgId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    await markExpiredPendingInvitations({ orgId: req.orgId });

    const [invitations, total] = await Promise.all([
      Invitation.find(filter)
        .populate({ path: 'invitedBy', select: 'name email avatar' })
        .populate({ path: 'acceptedByUserId', select: 'name email avatar' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Invitation.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        invitations: invitations.map(serializeInvitation),
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

export const revokeInvitation = async (req, res, next) => {
  try {
    const invitation = await getPendingInvitationInOrg(req.params.invitationId, req.orgId);

    invitation.status = 'revoked';
    await invitation.save();

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'invitation.revoked',
      targetType: 'invitation',
      targetId: invitation._id,
      metadata: {
        email: invitation.email,
        role: invitation.role,
      },
    });

    emitToOrg(req.orgId, 'invitation:revoked', { invitationId: invitation._id });

    return res.json({ success: true, message: 'Invitation revoked successfully' });
  } catch (error) {
    return next(error);
  }
};

export const resendInvitation = async (req, res, next) => {
  try {
    const invitation = await getPendingInvitationInOrg(req.params.invitationId, req.orgId);

    invitation.token = uuidv4();
    invitation.expiresAt = getExpirationDate();
    await invitation.save();

    await sendInvitationEmail({
      to: invitation.email,
      inviterName: req.user.name,
      orgName: req.org.name,
      role: invitation.role,
      acceptUrl: getAcceptUrl(invitation.token),
      expiresAt: invitation.expiresAt,
    });

    await logActivity({
      orgId: req.orgId,
      actorId: req.user._id,
      action: 'invitation.resent',
      targetType: 'invitation',
      targetId: invitation._id,
      metadata: {
        email: invitation.email,
        role: invitation.role,
      },
    });

    emitToOrg(req.orgId, 'invitation:resent', { invitationId: invitation._id });

    return res.json({ success: true, data: { invitation: serializeInvitation(invitation) } });
  } catch (error) {
    return next(error);
  }
};

export const getInvitationByToken = async (req, res, next) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token })
      .populate({ path: 'orgId', select: 'name logo' })
      .populate({ path: 'invitedBy', select: 'name' });

    if (!invitation) {
      throw createHttpError(404, 'Invitation not found');
    }

    await expireInvitationIfNeeded(invitation);

    return res.json({
      success: true,
      data: {
        invitation: {
          id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          org: invitation.orgId
            ? {
                id: invitation.orgId._id,
                name: invitation.orgId.name,
                logo: invitation.orgId.logo,
              }
            : null,
          inviter: invitation.invitedBy
            ? {
                id: invitation.invitedBy._id,
                name: invitation.invitedBy.name,
              }
            : null,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const acceptInvitation = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let invitation;
    let membership;
    let organization;

    await session.withTransaction(async () => {
      invitation = await Invitation.findOne({ token: req.body.token }).session(session);

      if (!invitation) {
        throw createHttpError(404, 'Invitation not found');
      }

      if (await expireInvitationIfNeeded(invitation, session)) {
        throw createHttpError(400, 'Invitation has expired');
      }

      if (invitation.status !== 'pending') {
        throw createHttpError(400, 'Invitation is no longer pending');
      }

      if (invitation.email !== req.user.email) {
        throw createHttpError(403, 'Invitation email does not match your account');
      }

      const existingMembership = await Membership.findOne({
        userId: req.user._id,
        orgId: invitation.orgId,
      }).session(session);

      if (existingMembership) {
        throw createHttpError(400, 'You are already a member of this organization');
      }

      organization = await Organization.findOneAndUpdate(
        {
          _id: invitation.orgId,
          isDeleted: false,
          $expr: { $lt: ['$seatsUsed', '$seatLimit'] },
        },
        { $inc: { seatsUsed: 1 } },
        { new: true, session },
      );

      if (!organization) {
        const orgExists = await Organization.exists({ _id: invitation.orgId, isDeleted: false }).session(session);
        throw createHttpError(orgExists ? 400 : 404, orgExists ? 'Seat limit reached' : 'Organization not found');
      }

      [membership] = await Membership.create(
        [
          {
            userId: req.user._id,
            orgId: invitation.orgId,
            role: invitation.role,
            invitedBy: invitation.invitedBy,
          },
        ],
        { session },
      );

      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      invitation.acceptedByUserId = req.user._id;
      await invitation.save({ session });
    });

    await logActivity({
      orgId: invitation.orgId,
      actorId: req.user._id,
      action: 'member.joined',
      targetType: 'membership',
      targetId: membership._id,
      metadata: {
        invitationId: invitation._id,
        role: membership.role,
      },
    });

    await sendWelcomeEmail({
      to: req.user.email,
      name: req.user.name,
      orgName: organization.name,
    });

    await createNotificationSafely({
      userId: invitation.invitedBy,
      orgId: invitation.orgId,
      type: 'invite_accepted',
      title: 'Invitation accepted',
      message: `${req.user.name} accepted your invitation to ${organization.name}.`,
      link: '/members',
      metadata: {
        invitationId: invitation._id,
        membershipId: membership._id,
        acceptedByUserId: req.user._id,
      },
    });

    await createOrgNotifications({
      orgId: invitation.orgId,
      excludeUserIds: [req.user._id, invitation.invitedBy],
      type: 'member_joined',
      title: 'New member joined',
      message: `${req.user.name} joined ${organization.name}.`,
      link: '/members',
      metadata: {
        membershipId: membership._id,
        userId: req.user._id,
        role: membership.role,
      },
    });

    emitToOrg(invitation.orgId, 'membership:created', {
      membershipId: membership._id,
      userId: req.user._id,
      role: membership.role,
    });

    return res.status(201).json({ success: true, data: { membership } });
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(400, 'You are already a member of this organization'));
    }

    return next(error);
  } finally {
    await session.endSession();
  }
};
