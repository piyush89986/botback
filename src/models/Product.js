import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    model: String,
    category: { type: String, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand: String,
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
    stock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },
    images: [String],
    description: String,
    features: [String],
    warranty: String,
    sku: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    pineconeId: String,
  },
  { timestamps: true },
);

productSchema.index({ businessId: 1, name: 'text', brand: 'text', model: 'text' });
productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ businessId: 1, brand: 1 });

export const Product = mongoose.model('Product', productSchema);
