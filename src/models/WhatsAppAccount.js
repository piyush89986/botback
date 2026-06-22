import mongoose from 'mongoose';

const whatsAppAccountSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, unique: true, index: true },
    phoneNumberId: { type: String, required: true },
    displayPhoneNumber: String,
    accessToken: { type: String, required: true, select: false },
    businessAccountId: String,
    webhookVerifyToken: String,
    isVerified: { type: Boolean, default: false },
    lastWebhookAt: Date,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const WhatsAppAccount = mongoose.model('WhatsAppAccount', whatsAppAccountSchema);
