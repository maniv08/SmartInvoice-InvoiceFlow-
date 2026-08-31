import { Router } from 'express';
import {
  getSystemStackInfo,
  syncToPostgres,
  clearRedisCache,
  runPostgresQuery,
} from '../controllers/postgresController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Stack overview (Public/Authenticated)
router.get('/stack-info', getSystemStackInfo);

// Sync trigger & Cache purge
router.post('/sync', authenticateJWT, syncToPostgres);
router.post('/cache/clear', authenticateJWT, clearRedisCache);

// Safe query execution (Admin / Dev testing)
router.post('/query', authenticateJWT, runPostgresQuery);

export default router;
