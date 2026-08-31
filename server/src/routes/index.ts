import { Router } from 'express';
import authRoutes from './authRoutes';
import invoiceRoutes from './invoiceRoutes';
import vendorRoutes from './vendorRoutes';
import approvalRoutes from './approvalRoutes';
import paymentRoutes from './paymentRoutes';
import dashboardRoutes from './dashboardRoutes';
import notificationRoutes from './notificationRoutes';
import reportRoutes from './reportRoutes';
import auditLogRoutes from './auditLogRoutes';
import settingRoutes from './settingRoutes';
import postgresRoutes from './postgresRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/vendors', vendorRoutes);
router.use('/approvals', approvalRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/settings', settingRoutes);
router.use('/postgres', postgresRoutes);
router.use('/system', postgresRoutes);

export default router;
