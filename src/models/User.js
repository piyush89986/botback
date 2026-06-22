import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['owner', 'admin', 'staff'],
      default: 'owner',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ businessId: 1, email: 1 });

export const User = mongoose.model('User', userSchema);
