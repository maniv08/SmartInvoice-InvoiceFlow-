import { Router } from 'express';
import {
  getSettings,
  updateApprovalThresholds,
  updateReminderConfig,
  updateCompanyProfile,
  getUsers,
  updateUserRole,
  triggerScheduler,
} from '../controllers/settingController';
import { authenticateJWT } from '../middleware/auth';
import { requireRoles } from '../middleware/rbac';
import { validateRequest } from '../middleware/validate';
import {
  updateApprovalThresholdsSchema,
  updateReminderConfigSchema,
  updateCompanyProfileSchema,
} from '../schemas/settingSchemas';

const router = Router();

router.use(authenticateJWT);

router.get('/', getSettings);
router.put('/approval-thresholds', requireRoles('ADMIN'), validateRequest(updateApprovalThresholdsSchema), updateApprovalThresholds);
router.put('/reminder-config', requireRoles('ADMIN'), validateRequest(updateReminderConfigSchema), updateReminderConfig);
router.put('/company-profile', requireRoles('ADMIN'), validateRequest(updateCompanyProfileSchema), updateCompanyProfile);

// User management
router.get('/users', requireRoles('ADMIN'), getUsers);
router.put('/users/:id/role', requireRoles('ADMIN'), updateUserRole);

// Trigger scheduler
router.post('/trigger-scheduler', requireRoles('ADMIN', 'FINANCE_MANAGER'), triggerScheduler);

export default router;
