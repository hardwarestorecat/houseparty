import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import logger from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: any;
    }
  }
}

/**
 * Authentication middleware to protect routes
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
    }

    // Get token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
    }

    // Get user from token
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    // Set user in request
    req.user = user;

    next();
  } catch (error: any) {
    logger.error(`Auth middleware error: ${error.message}`);
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }
};

/**
 * Middleware to check if user is verified
 */
export const isVerified = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is verified
    if (!req.user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email not verified',
      });
    }

    next();
  } catch (error: any) {
    logger.error(`Verification middleware error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

