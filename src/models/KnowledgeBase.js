import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'faq',
        'return_policy',
        'warranty_policy',
        'business_info',
        'installation',
        'service_info',
        'product_description',
        'general',
      ],
      default: 'faq',
    },
    tags: [String],
    pineconeId: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

knowledgeBaseSchema.index({ businessId: 1, type: 1 });

export const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
