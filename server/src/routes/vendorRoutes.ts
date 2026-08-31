import { Router } from 'express';
import {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} from '../controllers/vendorController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { createVendorSchema, updateVendorSchema } from '../schemas/vendorSchemas';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';

const router = Router();

router.use(authenticateJWT);

router.get('/', cacheMiddleware(30), getVendors);
router.get('/:id', cacheMiddleware(30), getVendorById);
router.post(
  '/',
  requireRoles('ADMIN', 'FINANCE_MANAGER'),
  validateRequest(createVendorSchema),
  invalidateCache(['/api/vendors', '/api/dashboard']),
  createVendor
);
router.put(
  '/:id',
  requireRoles('ADMIN', 'FINANCE_MANAGER'),
  validateRequest(updateVendorSchema),
  invalidateCache(['/api/vendors', '/api/dashboard']),
  updateVendor
);
router.delete(
  '/:id',
  requireRoles('ADMIN'),
  invalidateCache(['/api/vendors', '/api/dashboard']),
  deleteVendor
);

export default router;
