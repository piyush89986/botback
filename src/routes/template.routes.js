import { Router } from 'express';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/template.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantScope, validateTenantAccess } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, tenantScope, validateTenantAccess);

router.get('/', listTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
