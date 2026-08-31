import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FA,
  getOrganizations,
} from '../controllers/authController';
import { authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  verify2FASchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../schemas/authSchemas';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/organizations', getOrganizations);

router.get('/profile', authenticateJWT, getProfile);
router.put('/profile', authenticateJWT, validateRequest(updateProfileSchema), updateProfile);
router.put('/change-password', authenticateJWT, validateRequest(changePasswordSchema), changePassword);

// 2FA Routes
router.post('/2fa/setup', authenticateJWT, setup2FA);
router.post('/2fa/verify', authenticateJWT, validateRequest(verify2FASchema), verify2FA);
router.post('/2fa/disable', authenticateJWT, disable2FA);

export default router;
