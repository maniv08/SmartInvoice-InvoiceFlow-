import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.use(authenticateJWT);

router.get('/metrics', cacheMiddleware(15), getDashboardMetrics);

export default router;
