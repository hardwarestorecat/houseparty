import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Import controllers
// TODO: Implement friend controllers

// Protected routes
router.get('/', protect, (req, res) => {
  // Temporary placeholder until controller is implemented
  res.status(200).json({
    success: true,
    message: 'Get friends route',
    friends: [],
  });
});

router.post('/add', protect, (req, res) => {
  // Temporary placeholder until controller is implemented
  res.status(200).json({
    success: true,
    message: 'Add friend route',
  });
});

router.post('/match-contacts', protect, (req, res) => {
  // Temporary placeholder until controller is implemented
  res.status(200).json({
    success: true,
    message: 'Match contacts route',
    matches: [],
  });
});

export default router;

