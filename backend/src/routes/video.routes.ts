import express from 'express';
import { protect, isVerified } from '../middleware/auth';
import { generateToken, getActiveParties, joinParty, leaveParty } from '../controllers/video.controller';

const router = express.Router();

// Protected routes
router.post('/token', protect, isVerified, generateToken);
router.get('/parties', protect, isVerified, getActiveParties);
router.post('/parties/:id/join', protect, isVerified, joinParty);
router.post('/parties/:id/leave', protect, isVerified, leaveParty);

export default router;
