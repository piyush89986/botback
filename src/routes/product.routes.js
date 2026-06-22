import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
} from '../controllers/product.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { tenantScope, validateTenantAccess } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticate, tenantScope, validateTenantAccess);

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.post('/bulk', bulkImportProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
