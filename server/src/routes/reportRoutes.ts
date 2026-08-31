import { Router } from 'express';
import { getReportsData } from '../controllers/reportController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(requireRoles('ADMIN', 'FINANCE_MANAGER'));

router.get('/data', getReportsData);

export default router;
