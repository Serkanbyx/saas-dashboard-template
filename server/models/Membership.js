import mongoose from 'mongoose';
import { ORG_ROLES } from '../utils/constants.js';

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ORG_ROLES,
      default: 'member',
    },
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

membershipSchema.index({ userId: 1, orgId: 1 }, { unique: true });
membershipSchema.index({ orgId: 1, role: 1 });

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;
