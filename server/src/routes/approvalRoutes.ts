import { Router } from 'express';
import {
  getPendingApprovals,
  approveInvoice,
  rejectInvoice,
  getDelegations,
  createDelegation,
  revokeDelegation,
} from '../controllers/approvalController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import {
  approveInvoiceSchema,
  rejectInvoiceSchema,
  createDelegationSchema,
} from '../schemas/approvalSchemas';

const router = Router();

router.use(authenticateJWT);

router.get('/pending', requireRoles('ADMIN', 'FINANCE_MANAGER', 'APPROVER'), getPendingApprovals);
router.post('/:id/approve', requireRoles('ADMIN', 'FINANCE_MANAGER', 'APPROVER'), validateRequest(approveInvoiceSchema), approveInvoice);
router.post('/:id/reject', requireRoles('ADMIN', 'FINANCE_MANAGER', 'APPROVER'), validateRequest(rejectInvoiceSchema), rejectInvoice);

// Delegation routes
router.get('/delegations/list', getDelegations);
router.post('/delegations', requireRoles('ADMIN', 'FINANCE_MANAGER', 'APPROVER'), validateRequest(createDelegationSchema), createDelegation);
router.delete('/delegations/:id', requireRoles('ADMIN', 'FINANCE_MANAGER', 'APPROVER'), revokeDelegation);

export default router;
