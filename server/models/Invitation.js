import mongoose from 'mongoose';

const invitationRoles = ['admin', 'member'];
const invitationStatuses = ['pending', 'accepted', 'expired', 'revoked'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [emailRegex, 'Please provide a valid email address'],
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
      enum: invitationRoles,
      default: 'member',
    },
    token: {
      type: String,
      required: [true, 'Invitation token is required'],
      unique: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviter is required'],
    },
    status: {
      type: String,
      required: true,
      enum: invitationStatuses,
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
    },
    acceptedAt: Date,
    acceptedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
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

invitationSchema.index({ orgId: 1, status: 1 });
invitationSchema.index(
  { email: 1, orgId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  },
);

const Invitation = mongoose.model('Invitation', invitationSchema);

export { invitationRoles, invitationStatuses };
export default Invitation;
