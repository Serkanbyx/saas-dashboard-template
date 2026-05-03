import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters'],
      maxlength: [80, 'Organization name cannot exceed 80 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    plan: {
      type: String,
      required: true,
      enum: ['free', 'pro'],
      default: 'free',
    },
    planUpdatedAt: Date,
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organization owner is required'],
      index: true,
    },
    seatsUsed: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Seats used cannot be negative'],
    },
    seatLimit: {
      type: Number,
      required: true,
      default: 5,
      min: [0, 'Seat limit cannot be negative'],
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    deletedAt: Date,
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

organizationSchema.index({ ownerId: 1 });
organizationSchema.index({ isDeleted: 1, createdAt: -1 });

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
