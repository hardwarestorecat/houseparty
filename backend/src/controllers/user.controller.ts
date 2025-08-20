import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../utils/logger';

/**
 * Get user profile
 * @route GET /api/users/profile
 * @access Private
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Get user profile
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    logger.error(`Get user profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/profile
 * @access Private
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { username, profilePicture } = req.body;

    // Validate input
    if (username && (username.length < 3 || username.length > 30)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 30 characters',
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          ...(username && { username }),
          ...(profilePicture && { profilePicture }),
        },
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    logger.error(`Update user profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
    });
  }
};

/**
 * Update user settings
 * @route PUT /api/users/settings
 * @access Private
 */
export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { notifications, autoJoinEnabled, videoQuality, audioQuality, dataUsage } = req.body;

    // Update user settings
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'settings.notifications': notifications !== undefined ? notifications : req.user.settings.notifications,
          'settings.autoJoinEnabled': autoJoinEnabled !== undefined ? autoJoinEnabled : req.user.settings.autoJoinEnabled,
          'settings.videoQuality': videoQuality || req.user.settings.videoQuality || 'standard',
          'settings.audioQuality': audioQuality || req.user.settings.audioQuality || 'standard',
          'settings.dataUsage': dataUsage || req.user.settings.dataUsage || 'balanced',
        },
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    logger.error(`Update user settings error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update user settings',
    });
  }
};

/**
 * Register FCM token
 * @route POST /api/users/fcm-token
 * @access Private
 */
export const registerFCMToken = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'FCM token is required',
      });
    }

    // Update user FCM tokens
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { fcmTokens: token },
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token registered successfully',
    });
  } catch (error: any) {
    logger.error(`Register FCM token error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to register FCM token',
    });
  }
};

/**
 * Get friends in house
 * @route GET /api/users/friends/in-house
 * @access Private
 */
export const getFriendsInHouse = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Get user's friends
    const user = await User.findById(userId).select('friends');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get friends who are in the house
    const friends = await User.find({
      _id: { $in: user.friends },
      isInHouse: true,
    }).select('username email profilePicture lastActive');

    res.status(200).json({
      success: true,
      friends,
    });
  } catch (error: any) {
    logger.error(`Get friends in house error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get friends in house',
    });
  }
};

