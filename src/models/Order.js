import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerPhone: String,
    items: [orderItemSchema],
    totalAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    notes: String,
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

orderSchema.index({ businessId: 1, orderNumber: 1 }, { unique: true });

export const Order = mongoose.model('Order', orderSchema);
