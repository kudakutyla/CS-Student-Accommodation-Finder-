import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, logout, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts. Try again later.' },
});

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

export default router;
