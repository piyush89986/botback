import { Router } from 'express';
import { getBusiness, updateBusiness, updateCustomization } from '../controllers/business.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantScope, validateTenantAccess } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, tenantScope, validateTenantAccess);

router.get('/', getBusiness);
router.put('/', updateBusiness);
router.put('/customization', updateCustomization);

export default router;
