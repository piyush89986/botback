import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    name: String,
    email: String,
    whatsappId: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastMessageAt: Date,
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true },
);

customerSchema.index({ businessId: 1, phone: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
