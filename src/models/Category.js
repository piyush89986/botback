import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    description: String,
    image: String,
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ businessId: 1, slug: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
