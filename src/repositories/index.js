import { Business } from '../models/Business.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { Conversation } from '../models/Conversation.js';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { Template } from '../models/Template.js';
import { WhatsAppAccount } from '../models/WhatsAppAccount.js';
import { User } from '../models/User.js';

export const businessRepo = {
  create: (data) => Business.create(data),
  findByBusinessId: (businessId) => Business.findOne({ businessId }),
  findBySlug: (slug) => Business.findOne({ slug }),
  update: (businessId, data) => Business.findOneAndUpdate({ businessId }, data, { new: true }),
  findAll: (filter = {}) => Business.find(filter),
};

export const userRepo = {
  create: (data) => User.create(data),
  findByEmail: (email) => User.findOne({ email }).select('+password'),
  findById: (id) => User.findById(id),
  findByBusiness: (businessId) => User.find({ businessId }),
};

export const productRepo = {
  create: (data) => Product.create(data),
  findById: (id, businessId) => Product.findOne({ _id: id, businessId }),
  findByBusiness: (businessId, filter = {}) =>
    Product.find({ businessId, isActive: true, ...filter }),
  searchText: (businessId, query) => {
    // Guard against empty query
    if (!query || !query.trim()) {
      return Product.find({ businessId, isActive: true }).limit(10);
    }
    return Product.find({
      businessId,
      isActive: true,
      $or: [
        { name: { $regex: query.trim(), $options: 'i' } },
        { brand: { $regex: query.trim(), $options: 'i' } },
        { model: { $regex: query.trim(), $options: 'i' } },
        { category: { $regex: query.trim(), $options: 'i' } },
        { description: { $regex: query.trim(), $options: 'i' } },
      ],
    }).limit(10);
  },
  update: (id, businessId, data) =>
    Product.findOneAndUpdate({ _id: id, businessId }, data, { new: true }),
  delete: (id, businessId) =>
    Product.findOneAndUpdate({ _id: id, businessId }, { isActive: false }),
  bulkCreate: (items) => Product.insertMany(items),
};

export const categoryRepo = {
  create: (data) => Category.create(data),
  findByBusiness: (businessId) => Category.find({ businessId, isActive: true }),
  update: (id, businessId, data) =>
    Category.findOneAndUpdate({ _id: id, businessId }, data, { new: true }),
  delete: (id, businessId) =>
    Category.findOneAndUpdate({ _id: id, businessId }, { isActive: false }),
};

export const customerRepo = {
  upsert: async (businessId, phone, data = {}) => {
    return Customer.findOneAndUpdate(
      { businessId, phone },
      { $set: { ...data, lastMessageAt: new Date() } },
      { upsert: true, new: true },
    );
  },
  findByPhone: (businessId, phone) => Customer.findOne({ businessId, phone }),
  findByBusiness: (businessId) =>
    Customer.find({ businessId }).sort({ lastMessageAt: -1 }),
};

export const orderRepo = {
  create: (data) => Order.create(data),
  findByBusiness: (businessId) => Order.find({ businessId }).sort({ createdAt: -1 }),
  findByOrderNumber: (businessId, orderNumber) =>
    Order.findOne({ businessId, orderNumber }),
  updateStatus: (id, businessId, status) =>
    Order.findOneAndUpdate({ _id: id, businessId }, { status }, { new: true }),
};

export const conversationRepo = {
  findOrCreate: async (businessId, customerPhone, customerId) => {
    let conv = await Conversation.findOne({ businessId, customerPhone, isActive: true });
    if (!conv) {
      conv = await Conversation.create({
        businessId,
        customerPhone,
        customerId,
        messages: [],
      });
    }
    return conv;
  },
  addMessage: async (conversationId, message) => {
    return Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: { messages: message },
        lastIntent: message.intent,
        updatedAt: new Date(),
      },
      { new: true },
    );
  },
  findByBusiness: (businessId) =>
    Conversation.find({ businessId })
      .sort({ updatedAt: -1 })
      .limit(100)
      .select('-messages'), // exclude messages for list view performance
  getRecentMessages: (conversation, limit = 10) => {
    if (!conversation?.messages) return [];
    return conversation.messages.slice(-limit);
  },
};

export const knowledgeRepo = {
  create: (data) => KnowledgeBase.create(data),
  findByBusiness: (businessId, filter = {}) =>
    KnowledgeBase.find({ businessId, isActive: true, ...filter }),
  findById: (id, businessId) => KnowledgeBase.findOne({ _id: id, businessId }),
  update: (id, businessId, data) =>
    KnowledgeBase.findOneAndUpdate({ _id: id, businessId }, data, { new: true }),
  delete: (id, businessId) =>
    KnowledgeBase.findOneAndUpdate({ _id: id, businessId }, { isActive: false }),
};

export const templateRepo = {
  create: (data) => Template.create(data),
  findByBusiness: (businessId) => Template.find({ businessId, isActive: true }),
  findByType: (businessId, type) =>
    Template.findOne({ businessId, type, isActive: true, isDefault: true }),
  findById: (id, businessId) => Template.findOne({ _id: id, businessId }),
  update: (id, businessId, data) =>
    Template.findOneAndUpdate({ _id: id, businessId }, data, { new: true }),
  delete: (id, businessId) =>
    Template.findOneAndUpdate({ _id: id, businessId }, { isActive: false }),
};

export const whatsappAccountRepo = {
  upsert: (businessId, data) =>
    WhatsAppAccount.findOneAndUpdate({ businessId }, data, {
      upsert: true,
      new: true,
    }).select('+accessToken'),
  findByBusinessId: (businessId) =>
    WhatsAppAccount.findOne({ businessId }).select('+accessToken'),
  findByPhoneNumberId: (phoneNumberId) =>
    WhatsAppAccount.findOne({ phoneNumberId }).select('+accessToken'),
};
