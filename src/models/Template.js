import mongoose from 'mongoose';

const buttonSchema = new mongoose.Schema(
  {
    id: String,
    title: { type: String, required: true },
    type: { type: String, enum: ['reply', 'url', 'phone'], default: 'reply' },
    payload: String,
    url: String,
  },
  { _id: false },
);

const templateSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'product_card',
        'product_carousel',
        'product_details',
        'interactive_buttons',
        'list_message',
        'call_to_action',
        'text',
      ],
      required: true,
    },
    header: {
      type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
      content: String,
    },
    body: { type: String, required: true },
    footer: String,
    buttons: [buttonSchema],
    listSections: [
      {
        title: String,
        rows: [{ id: String, title: String, description: String }],
      },
    ],
    variables: [String],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

templateSchema.index({ businessId: 1, type: 1 });

export const Template = mongoose.model('Template', templateSchema);
