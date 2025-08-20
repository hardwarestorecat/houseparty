import express from 'express';
import { protect, isVerified } from '../middleware/auth';
import { 
  createParty, 
  getParties, 
  getParty, 
  joinParty, 
  leaveParty, 
  inviteToParty 
} from '../controllers/party.controller';

const router = express.Router();

// Protected routes
router.get('/', protect, isVerified, getParties);
router.post('/', protect, isVerified, createParty);
router.get('/:id', protect, isVerified, getParty);
router.post('/:id/join', protect, isVerified, joinParty);
router.post('/:id/leave', protect, isVerified, leaveParty);
router.post('/:id/invite', protect, isVerified, inviteToParty);

export default router;
