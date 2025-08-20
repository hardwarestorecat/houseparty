import express from 'express';
import { protect, isVerified } from '../middleware/auth';
import {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  registerFCMToken,
  getFriendsInHouse,
} from '../controllers/user.controller';

const router = express.Router();

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, isVerified, updateUserProfile);
router.put('/settings', protect, isVerified, updateUserSettings);
router.post('/fcm-token', protect, registerFCMToken);
router.get('/friends/in-house', protect, isVerified, getFriendsInHouse);

export default router;

