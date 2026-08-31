import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(requireRoles('ADMIN', 'FINANCE_MANAGER'));

router.get('/', getAuditLogs);

export default router;
