import { Router } from 'express';
import { registerUser, loginUser, forgotPasswordController, resetPasswordController } from './auth.controller.js';
import { 
  validate, 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../../middleware/validation.middleware.js';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), registerUser);
router.post('/login', authLimiter, validate(loginSchema), loginUser);
router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post('/reset-password', passwordResetLimiter, validate(resetPasswordSchema), resetPasswordController);

export default router;
