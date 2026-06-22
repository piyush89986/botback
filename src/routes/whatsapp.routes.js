import { Router } from 'express';
import { getWhatsAppSettings, saveWhatsAppSettings } from '../controllers/whatsapp.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantScope, validateTenantAccess } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, tenantScope, validateTenantAccess);

router.get('/', getWhatsAppSettings);
router.post('/', saveWhatsAppSettings);

export default router;
