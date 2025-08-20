import { Request, Response } from 'express';
import User from '../models/User';
import Invitation from '../models/Invitation';
import logger from '../utils/logger';
import { sendPushNotification } from '../utils/notifications';

/**
 * Get user's friends
 * @route GET /api/friends
 * @access Private
 */
export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Get user with populated friends
    const user = await User.findById(userId).populate('friends', 'username email phone profilePicture isInHouse lastActive');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      friends: user.friends,
    });
  } catch (error: any) {
    logger.error(`Get friends error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get friends',
    });
  }
};

/**
 * Get friend requests
 * @route GET /api/friends/requests
 * @access Private
 */
export const getFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    // Get pending friend invitations
    const invitations = await Invitation.find({
      receiverId: userId,
      type: 'friend',
      status: 'pending',
    }).populate('senderId', 'username email phone profilePicture');

    res.status(200).json({
      success: true,
      requests: invitations,
    });
  } catch (error: any) {
    logger.error(`Get friend requests error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get friend requests',
    });
  }
};

/**
 * Send friend request
 * @route POST /api/friends/request
 * @access Private
 */
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const { userId, email, phone } = req.body;
    const senderId = req.user._id;

    // Validate input
    if (!userId && !email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'User ID, email, or phone is required',
      });
    }

    // Find receiver
    let receiver;
    if (userId) {
      receiver = await User.findById(userId);
    } else if (email) {
      receiver = await User.findOne({ email });
    } else if (phone) {
      receiver = await User.findOne({ phone });
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if already friends
    if (receiver.friends.includes(senderId)) {
      return res.status(400).json({
        success: false,
        error: 'Already friends with this user',
      });
    }

    // Check if request already sent
    const existingRequest = await Invitation.findOne({
      senderId,
      receiverId: receiver._id,
      type: 'friend',
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Friend request already sent',
      });
    }

    // Check if receiver already sent a request
    const receiverRequest = await Invitation.findOne({
      senderId: receiver._id,
      receiverId: senderId,
      type: 'friend',
      status: 'pending',
    });

    if (receiverRequest) {
      // Auto-accept the request
      receiverRequest.status = 'accepted';
      await receiverRequest.save();

      // Add to friends list
      await User.findByIdAndUpdate(senderId, {
        $addToSet: { friends: receiver._id },
      });

      await User.findByIdAndUpdate(receiver._id, {
        $addToSet: { friends: senderId },
      });

      return res.status(200).json({
        success: true,
        message: 'Friend request accepted',
      });
    }

    // Create invitation
    const invitation = await Invitation.create({
      senderId,
      receiverId: receiver._id,
      type: 'friend',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Send push notification
    if (receiver.fcmTokens && receiver.fcmTokens.length > 0 && receiver.settings.notifications) {
      const notificationMessage = `${req.user.username} sent you a friend request`;
      
      receiver.fcmTokens.forEach((token) => {
        sendPushNotification(
          token,
          'House Party',
          notificationMessage,
          {
            type: 'friend_request',
            invitationId: invitation._id.toString(),
          }
        );
      });
    }

    res.status(200).json({
      success: true,
      message: 'Friend request sent',
      invitation,
    });
  } catch (error: any) {
    logger.error(`Send friend request error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to send friend request',
    });
  }
};

/**
 * Respond to friend request
 * @route POST /api/friends/respond
 * @access Private
 */
export const respondToFriendRequest = async (req: Request, res: Response) => {
  try {
    const { invitationId, accept } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!invitationId) {
      return res.status(400).json({
        success: false,
        error: 'Invitation ID is required',
      });
    }

    // Find invitation
    const invitation = await Invitation.findById(invitationId);
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found',
      });
    }

    // Check if user is the receiver
    if (invitation.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to respond to this invitation',
      });
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Invitation already responded to',
      });
    }

    // Update invitation status
    invitation.status = accept ? 'accepted' : 'declined';
    await invitation.save();

    // If accepted, add to friends list
    if (accept) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { friends: invitation.senderId },
      });

      await User.findByIdAndUpdate(invitation.senderId, {
        $addToSet: { friends: userId },
      });

      // Send push notification to sender
      const sender = await User.findById(invitation.senderId);
      
      if (sender && sender.fcmTokens && sender.fcmTokens.length > 0 && sender.settings.notifications) {
        const notificationMessage = `${req.user.username} accepted your friend request`;
        
        sender.fcmTokens.forEach((token) => {
          sendPushNotification(
            token,
            'House Party',
            notificationMessage,
            {
              type: 'friend_request_accepted',
              userId: userId.toString(),
            }
          );
        });
      }
    }

    res.status(200).json({
      success: true,
      message: accept ? 'Friend request accepted' : 'Friend request declined',
    });
  } catch (error: any) {
    logger.error(`Respond to friend request error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to friend request',
    });
  }
};

/**
 * Remove friend
 * @route DELETE /api/friends/:id
 * @access Private
 */
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Remove from user's friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: id },
    });

    // Remove from friend's friends list
    await User.findByIdAndUpdate(id, {
      $pull: { friends: userId },
    });

    res.status(200).json({
      success: true,
      message: 'Friend removed',
    });
  } catch (error: any) {
    logger.error(`Remove friend error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to remove friend',
    });
  }
};

/**
 * Search users
 * @route GET /api/friends/search
 * @access Private
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const userId = req.user._id;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
      });
    }

    // Get user's friends
    const user = await User.findById(userId).select('friends');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Search users by username, email, or phone
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        { _id: { $nin: user.friends } }, // Exclude friends
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    }).select('username email phone profilePicture');

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    logger.error(`Search users error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    });
  }
};

