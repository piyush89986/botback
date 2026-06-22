import { Router } from 'express';
import { uploadMiddleware, uploadFile } from '../controllers/upload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantScope, validateTenantAccess } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, tenantScope, validateTenantAccess);
router.post('/', uploadMiddleware, uploadFile);

export default router;
