import { Router } from 'express';
import {
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from '../controllers/knowledge.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantScope, validateTenantAccess } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, tenantScope, validateTenantAccess);

router.get('/', listKnowledge);
router.post('/', createKnowledge);
router.put('/:id', updateKnowledge);
router.delete('/:id', deleteKnowledge);

export default router;
