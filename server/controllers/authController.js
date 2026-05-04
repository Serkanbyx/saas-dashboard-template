import ActivityLog from '../models/ActivityLog.js';
import BillingRecord from '../models/BillingRecord.js';
import Invitation from '../models/Invitation.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

const restrictedProfileFields = ['email', 'password', 'platformRole', 'isActive'];

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });

const sendAuthResponse = (res, statusCode, user) => {
  res.status(statusCode).json({
    success: true,
    data: {
      user,
      token: generateToken(user._id),
    },
  });
};

const deleteOrgRelatedData = (orgId) =>
  Promise.all([
    Membership.deleteMany({ orgId }),
    Invitation.deleteMany({ orgId }),
    Notification.deleteMany({ orgId }),
    ActivityLog.deleteMany({ orgId }),
    BillingRecord.deleteMany({ orgId }),
  ]);

const cascadeDeleteAccountData = async (user) => {
  const userId = user._id;
  const membershipsToRemove = await Membership.find({ userId }).select('orgId');
  const deletedOrgIds = new Set();
  const ownedOrganizations = await Organization.find({
    ownerId: userId,
    isDeleted: { $ne: true },
  });

  await Promise.all(
    ownedOrganizations.map(async (organization) => {
      const remainingMemberships = await Membership.find({
        orgId: organization._id,
        userId: { $ne: userId },
      }).sort({ role: 1, joinedAt: 1 });

      const nextOwner =
        remainingMemberships.find((membership) => membership.role === 'admin') || remainingMemberships[0];

      if (nextOwner) {
        nextOwner.role = 'owner';
        organization.ownerId = nextOwner.userId;
        organization.seatsUsed = Math.max((organization.seatsUsed || 1) - 1, 0);
        await Promise.all([nextOwner.save(), organization.save()]);
        return;
      }

      organization.isDeleted = true;
      organization.deletedAt = new Date();
      deletedOrgIds.add(organization._id.toString());
      await organization.save();
      await deleteOrgRelatedData(organization._id);
    }),
  );

  const orgIdsToDecrement = membershipsToRemove
    .map((membership) => membership.orgId)
    .filter((orgId) => !deletedOrgIds.has(orgId.toString()));

  await Promise.all([
    Membership.deleteMany({ userId }),
    Organization.updateMany({ _id: { $in: orgIdsToDecrement } }, { $inc: { seatsUsed: -1 } }),
    Invitation.deleteMany({
      $or: [{ invitedBy: userId }, { acceptedByUserId: userId }, { email: user.email }],
    }),
    Notification.deleteMany({ userId }),
    ActivityLog.deleteMany({ actorId: userId }),
    BillingRecord.deleteMany({ actorId: userId }),
  ]);
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw createHttpError(400, 'Registration failed');
    }

    const user = await User.create({ name, email, password });
    sendAuthResponse(res, 201, user);
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(400, 'Registration failed'));
    }

    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw createHttpError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw createHttpError(401, 'Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save();

    sendAuthResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: { user: req.user } });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const hasRestrictedField = restrictedProfileFields.some((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field),
    );

    if (hasRestrictedField) {
      throw createHttpError(400, 'This field cannot be updated');
    }

    const { name, avatar } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.comparePassword(currentPassword))) {
      throw createHttpError(400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const completeOnboarding = async (req, res, next) => {
  try {
    req.user.hasCompletedOnboarding = true;
    await req.user.save();

    res.json({ success: true, data: { user: req.user } });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      throw createHttpError(400, 'Password is incorrect');
    }

    await cascadeDeleteAccountData(user);
    await User.deleteOne({ _id: user._id });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
