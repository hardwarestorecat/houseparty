import express from 'express';
import { protect, isVerified } from '../middleware/auth';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  searchUsers,
} from '../controllers/friend.controller';

const router = express.Router();

// Protected routes
router.get('/', protect, isVerified, getFriends);
router.get('/requests', protect, isVerified, getFriendRequests);
router.post('/request', protect, isVerified, sendFriendRequest);
router.post('/respond', protect, isVerified, respondToFriendRequest);
router.delete('/:id', protect, isVerified, removeFriend);
router.get('/search', protect, isVerified, searchUsers);

export default router;

