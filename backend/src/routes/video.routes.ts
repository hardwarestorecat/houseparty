import express from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Import controllers
// TODO: Implement video controllers

// Protected routes
router.post('/token', protect, (req, res) => {
  // Temporary placeholder until controller is implemented
  res.status(200).json({
    success: true,
    message: 'Video token route',
    token: 'dummy-token',
  });
});

export default router;

