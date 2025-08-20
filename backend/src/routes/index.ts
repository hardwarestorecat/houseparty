import express from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import videoRoutes from './video.routes';
import friendRoutes from './friend.routes';
import partyRoutes from './party.routes';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/video', videoRoutes);
router.use('/friends', friendRoutes);
router.use('/parties', partyRoutes);

export default router;

