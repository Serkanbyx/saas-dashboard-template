import mongoose from 'mongoose';

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

export const ACTIVITY_TARGET_TYPES = ['user', 'membership', 'invitation', 'organization', 'billing'];

const oneYearInSeconds = 60 * 60 * 24 * 365;

const activityLogSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: ACTIVITY_ACTIONS,
    },
    targetType: {
      type: String,
      enum: ACTIVITY_TARGET_TYPES,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

activityLogSchema.index({ orgId: 1, createdAt: -1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: oneYearInSeconds });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
