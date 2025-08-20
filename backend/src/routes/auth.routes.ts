import express from 'express';
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  getCurrentUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.post('/change-password', protect, changePassword);

export default router;

