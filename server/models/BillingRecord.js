import mongoose from 'mongoose';

const billingRecordTypes = ['subscription', 'upgrade', 'downgrade', 'invoice'];
const billingPlans = ['free', 'pro'];
const billingStatuses = ['paid', 'pending', 'failed'];

const billingRecordSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor is required'],
    },
    type: {
      type: String,
      required: [true, 'Billing type is required'],
      enum: billingRecordTypes,
    },
    previousPlan: {
      type: String,
      enum: billingPlans,
    },
    newPlan: {
      type: String,
      required: [true, 'New plan is required'],
      enum: billingPlans,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: billingStatuses,
      default: 'paid',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      trim: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: Date,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

billingRecordSchema.index({ orgId: 1, createdAt: -1 });
billingRecordSchema.index({ invoiceNumber: 1 }, { unique: true });

export { billingPlans, billingRecordTypes, billingStatuses };
export default mongoose.model('BillingRecord', billingRecordSchema);
