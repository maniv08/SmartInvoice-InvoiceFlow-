import { Router } from 'express';
import {
  getPayments,
  recordPayment,
  updatePaymentStatus,
} from '../controllers/paymentController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import { createPaymentSchema, updatePaymentStatusSchema } from '../schemas/paymentSchemas';

const router = Router();

router.use(authenticateJWT);

router.get('/', getPayments);
router.post('/', requireRoles('ADMIN', 'FINANCE_MANAGER'), validateRequest(createPaymentSchema), recordPayment);
router.put('/:id/status', requireRoles('ADMIN', 'FINANCE_MANAGER'), validateRequest(updatePaymentStatusSchema), updatePaymentStatus);

export default router;
