import mongoose from 'mongoose';

const themeSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: '#2563eb' },
    secondaryColor: { type: String, default: '#1e40af' },
    accentColor: { type: String, default: '#f59e0b' },
    fontFamily: { type: String, default: 'Inter' },
  },
  { _id: false },
);

const whatsappConfigSchema = new mongoose.Schema(
  {
    phoneNumberId: String,
    accessToken: String,
    businessAccountId: String,
    webhookVerifyToken: String,
    isConnected: { type: Boolean, default: false },
  },
  { _id: false },
);

const customizationSchema = new mongoose.Schema(
  {
    greetingMessage: {
      type: String,
      default: 'Welcome! How can we help you today?',
    },
    welcomeFlow: { type: String, default: 'default' },
    ctaButtons: [
      {
        id: String,
        title: String,
        action: String,
      },
    ],
    cardLayout: { type: String, default: 'standard' },
    outOfScopeMessage: {
      type: String,
      default:
        'I can assist only with business products, services, support and related information.',
    },
  },
  { _id: false },
);

const businessSchema = new mongoose.Schema(
  {
    businessId: { type: String, required: true, unique: true, index: true },
    businessName: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    logo: String,
    phone: String,
    email: { type: String, required: true },
    address: String,
    industry: String,
    theme: { type: themeSchema, default: () => ({}) },
    whatsapp: { type: whatsappConfigSchema, default: () => ({}) },
    pineconeNamespace: { type: String, required: true },
    customization: { type: customizationSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Business = mongoose.model('Business', businessSchema);
