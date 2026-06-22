import { Router } from 'express';
import {
  listConversations,
  listCustomers,
  listOrders,
  updateOrderStatus,
} from '../controllers/conversation.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantScope, validateTenantAccess } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, tenantScope, validateTenantAccess);

router.get('/conversations', listConversations);
router.get('/customers', listCustomers);
router.get('/orders', listOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
