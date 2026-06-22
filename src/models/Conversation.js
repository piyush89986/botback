import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    intent: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const conversationSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerPhone: { type: String, required: true },
    messages: [messageSchema],
    lastIntent: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

conversationSchema.index({ businessId: 1, customerPhone: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
