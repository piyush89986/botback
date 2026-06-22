import { conversationRepo, customerRepo, orderRepo } from '../repositories/index.js';

export async function listConversations(req, res, next) {
  try {
    const conversations = await conversationRepo.findByBusiness(req.businessId);
    res.json({ success: true, data: conversations });
  } catch (err) {
    next(err);
  }
}

export async function listCustomers(req, res, next) {
  try {
    const customers = await customerRepo.findByBusiness(req.businessId);
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(req, res, next) {
  try {
    const orders = await orderRepo.findByBusiness(req.businessId);
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const order = await orderRepo.updateStatus(req.params.id, req.businessId, req.body.status);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}
