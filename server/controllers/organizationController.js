import mongoose from 'mongoose';
import Membership from '../models/Membership.js';
import Organization from '../models/Organization.js';
import { logActivity } from '../services/activityService.js';
import { PLANS } from '../utils/constants.js';
import { generateUniqueSlug } from '../utils/generateSlug.js';

const createHttpError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const editableOrgFields = ['name', 'description', 'logo'];

const pickEditableOrgFields = (body) =>
  editableOrgFields.reduce((updates, field) => {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }

    return updates;
  }, {});

const importOptionalModel = async (modelPath) => {
  try {
    const modelModule = await import(modelPath);
    return modelModule.default;
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      return null;
    }

    throw error;
  }
};

const cascadeSoftDeleteOrgData = async ({ orgId, session }) => {
  const [Invitation, Notification, ActivityLog, BillingRecord] = await Promise.all([
    importOptionalModel('../models/Invitation.js'),
    importOptionalModel('../models/Notification.js'),
    importOptionalModel('../models/ActivityLog.js'),
    importOptionalModel('../models/BillingRecord.js'),
  ]);

  const cascadeOperations = [Membership.deleteMany({ orgId }).session(session)];

  if (Invitation) cascadeOperations.push(Invitation.deleteMany({ orgId }).session(session));
  if (Notification) cascadeOperations.push(Notification.deleteMany({ orgId }).session(session));
  if (ActivityLog) cascadeOperations.push(ActivityLog.deleteMany({ orgId }).session(session));
  if (BillingRecord) cascadeOperations.push(BillingRecord.deleteMany({ orgId }).session(session));

  await Promise.all(cascadeOperations);
};

export const createOrg = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    let organization;

    await session.withTransaction(async () => {
      const { name, description, logo } = pickEditableOrgFields(req.body);
      const slug = await generateUniqueSlug(name);

      [organization] = await Organization.create(
        [
          {
            name,
            description,
            logo,
            slug,
            ownerId: req.user._id,
            plan: 'free',
            seatsUsed: 1,
            seatLimit: PLANS.free.seatLimit,
          },
        ],
        { session },
      );

      await Membership.create(
        [
          {
            userId: req.user._id,
            orgId: organization._id,
            role: 'owner',
          },
        ],
        { session },
      );
    });

    await logActivity({
      orgId: organization._id,
      actorId: req.user._id,
      action: 'org.created',
      targetType: 'organization',
      targetId: organization._id,
      metadata: { name: organization.name },
    });

    return res.status(201).json({ success: true, data: { organization } });
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(400, 'Organization already exists'));
    }

    return next(error);
  } finally {
    await session.endSession();
  }
};

export const getMyOrgs = async (req, res, next) => {
  try {
    const memberships = await Membership.find({ userId: req.user._id })
      .populate({ path: 'orgId', match: { isDeleted: false } })
      .sort({ joinedAt: -1 });

    const organizations = memberships
      .filter((membership) => membership.orgId)
      .map((membership) => ({
        ...membership.orgId.toObject(),
        role: membership.role,
      }));

    return res.json({ success: true, data: { organizations } });
  } catch (error) {
    return next(error);
  }
};

export const getOrgById = async (req, res, next) => {
  try {
    return res.json({ success: true, data: { organization: req.org } });
  } catch (error) {
    return next(error);
  }
};

export const updateOrg = async (req, res, next) => {
  try {
    const updates = pickEditableOrgFields(req.body);
    const isLogoChanged = Object.hasOwn(updates, 'logo') && updates.logo !== req.org.logo;

    Object.assign(req.org, updates);
    await req.org.save();

    await logActivity({
      orgId: req.org._id,
      actorId: req.user._id,
      action: isLogoChanged ? 'org.logo_changed' : 'org.updated',
      targetType: 'organization',
      targetId: req.org._id,
      metadata: { fields: Object.keys(updates) },
    });

    return res.json({ success: true, data: { organization: req.org } });
  } catch (error) {
    return next(error);
  }
};

export const deleteOrg = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    if (req.body.confirmName !== req.org.name) {
      throw createHttpError(400, 'Organization name confirmation does not match');
    }

    await session.withTransaction(async () => {
      req.org.isDeleted = true;
      req.org.deletedAt = new Date();
      await req.org.save({ session });

      await cascadeSoftDeleteOrgData({ orgId: req.org._id, session });
    });

    return res.json({ success: true, message: 'Organization deleted successfully' });
  } catch (error) {
    return next(error);
  } finally {
    await session.endSession();
  }
};
