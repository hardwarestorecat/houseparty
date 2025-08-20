import { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import Party from '../models/Party';
import User from '../models/User';
import Invitation from '../models/Invitation';
import config from '../config/config';
import logger from '../utils/logger';
import { sendPushNotification } from '../utils/notifications';

/**
 * Create a new party
 * @route POST /api/parties
 * @access Private
 */
export const createParty = async (req: Request, res: Response) => {
  try {
    const { name, maxParticipants } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Party name is required',
      });
    }

    // Generate a unique channel name
    const channelName = `party_${Date.now()}_${userId.toString().substring(0, 6)}`;

    // Create party
    const party = await Party.create({
      name,
      hostId: userId,
      participants: [userId], // Host is automatically a participant
      channelName,
      maxParticipants: maxParticipants || 10,
    });

    // Generate token for host
    const userUid = parseInt(userId.toString().substring(0, 8), 16);
    
    // Get Agora app ID and certificate from config
    const appID = config.agora.appId;
    const appCertificate = config.agora.appCertificate;
    
    if (!appID || !appCertificate) {
      logger.error('Agora app ID or certificate not configured');
      return res.status(500).json({
        success: false,
        error: 'Video service not properly configured',
      });
    }

    // Set token expiration time (in seconds)
    const expirationTimeInSeconds = config.agora.tokenExpiry;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      channelName,
      userUid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    // Return party data and token
    res.status(201).json({
      success: true,
      party,
      token,
      uid: userUid,
    });
  } catch (error: any) {
    logger.error(`Create party error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to create party',
    });
  }
};

/**
 * Get all active parties
 * @route GET /api/parties
 * @access Private
 */
export const getParties = async (req: Request, res: Response) => {
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

    // Find active parties where host or participants include user or user's friends
    const parties = await Party.find({
      isActive: true,
      $or: [
        { hostId: userId },
        { participants: userId },
        { hostId: { $in: user.friends } },
        { participants: { $in: user.friends } },
      ],
    })
      .populate('hostId', 'username profilePicture')
      .populate('participants', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      parties,
    });
  } catch (error: any) {
    logger.error(`Get parties error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get parties',
    });
  }
};

/**
 * Get a specific party
 * @route GET /api/parties/:id
 * @access Private
 */
export const getParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find party
    const party = await Party.findById(id)
      .populate('hostId', 'username profilePicture')
      .populate('participants', 'username profilePicture');
    
    if (!party) {
      return res.status(404).json({
        success: false,
        error: 'Party not found',
      });
    }

    res.status(200).json({
      success: true,
      party,
    });
  } catch (error: any) {
    logger.error(`Get party error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get party',
    });
  }
};

/**
 * Join a party
 * @route POST /api/parties/:id/join
 * @access Private
 */
export const joinParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find party
    const party = await Party.findById(id);
    
    if (!party) {
      return res.status(404).json({
        success: false,
        error: 'Party not found',
      });
    }

    if (!party.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Party is no longer active',
      });
    }

    // Check if party is full
    if (party.participants.length >= party.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Party is full',
      });
    }

    // Check if user is already in the party
    if (party.participants.includes(userId)) {
      // Generate token for existing participant
      const userUid = parseInt(userId.toString().substring(0, 8), 16);
      
      // Get Agora app ID and certificate from config
      const appID = config.agora.appId;
      const appCertificate = config.agora.appCertificate;
      
      if (!appID || !appCertificate) {
        logger.error('Agora app ID or certificate not configured');
        return res.status(500).json({
          success: false,
          error: 'Video service not properly configured',
        });
      }

      // Set token expiration time (in seconds)
      const expirationTimeInSeconds = config.agora.tokenExpiry;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      // Build the token
      const token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        party.channelName,
        userUid,
        RtcRole.PUBLISHER,
        privilegeExpiredTs
      );

      return res.status(200).json({
        success: true,
        message: 'Already in party',
        party,
        token,
        uid: userUid,
      });
    }

    // Add user to party participants
    party.participants.push(userId);
    await party.save();

    // Generate token for new participant
    const userUid = parseInt(userId.toString().substring(0, 8), 16);
    
    // Get Agora app ID and certificate from config
    const appID = config.agora.appId;
    const appCertificate = config.agora.appCertificate;
    
    if (!appID || !appCertificate) {
      logger.error('Agora app ID or certificate not configured');
      return res.status(500).json({
        success: false,
        error: 'Video service not properly configured',
      });
    }

    // Set token expiration time (in seconds)
    const expirationTimeInSeconds = config.agora.tokenExpiry;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appID,
      appCertificate,
      party.channelName,
      userUid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    // Get host details for notification
    const host = await User.findById(party.hostId).select('username');

    // Notify host and other participants
    const notificationMessage = `${req.user.username} joined ${party.name}`;
    
    // Notify all participants except the user who joined
    const participantsToNotify = party.participants.filter(
      (participantId) => participantId.toString() !== userId.toString()
    );
    
    if (participantsToNotify.length > 0) {
      // Get FCM tokens for participants
      const participants = await User.find({
        _id: { $in: participantsToNotify },
        'settings.notifications': true,
      }).select('fcmTokens');
      
      // Send push notifications
      participants.forEach((participant) => {
        if (participant.fcmTokens && participant.fcmTokens.length > 0) {
          participant.fcmTokens.forEach((token) => {
            sendPushNotification(
              token,
              'House Party',
              notificationMessage,
              {
                type: 'party_join',
                partyId: party._id.toString(),
              }
            );
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Joined party successfully',
      party,
      token,
      uid: userUid,
    });
  } catch (error: any) {
    logger.error(`Join party error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to join party',
    });
  }
};

/**
 * Leave a party
 * @route POST /api/parties/:id/leave
 * @access Private
 */
export const leaveParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find party
    const party = await Party.findById(id);
    
    if (!party) {
      return res.status(404).json({
        success: false,
        error: 'Party not found',
      });
    }

    // Check if user is in the party
    if (!party.participants.includes(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Not in party',
      });
    }

    // Remove user from party participants
    party.participants = party.participants.filter(
      (participantId) => participantId.toString() !== userId.toString()
    );

    // If host leaves and there are other participants, transfer host role
    if (party.hostId.toString() === userId.toString() && party.participants.length > 0) {
      party.hostId = party.participants[0];
    }

    // If no participants left, mark party as inactive
    if (party.participants.length === 0) {
      party.isActive = false;
    }

    await party.save();

    // Notify remaining participants
    if (party.participants.length > 0) {
      const notificationMessage = `${req.user.username} left ${party.name}`;
      
      // Get FCM tokens for participants
      const participants = await User.find({
        _id: { $in: party.participants },
        'settings.notifications': true,
      }).select('fcmTokens');
      
      // Send push notifications
      participants.forEach((participant) => {
        if (participant.fcmTokens && participant.fcmTokens.length > 0) {
          participant.fcmTokens.forEach((token) => {
            sendPushNotification(
              token,
              'House Party',
              notificationMessage,
              {
                type: 'party_leave',
                partyId: party._id.toString(),
              }
            );
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Left party successfully',
    });
  } catch (error: any) {
    logger.error(`Leave party error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to leave party',
    });
  }
};

/**
 * Invite a user to a party
 * @route POST /api/parties/:id/invite
 * @access Private
 */
export const inviteToParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, phone, email } = req.body;
    const senderId = req.user._id;

    // Validate input
    if (!userId && !phone && !email) {
      return res.status(400).json({
        success: false,
        error: 'User ID, phone, or email is required',
      });
    }

    // Find party
    const party = await Party.findById(id);
    
    if (!party) {
      return res.status(404).json({
        success: false,
        error: 'Party not found',
      });
    }

    if (!party.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Party is no longer active',
      });
    }

    // Check if user is in the party
    if (!party.participants.includes(senderId)) {
      return res.status(400).json({
        success: false,
        error: 'You must be in the party to invite others',
      });
    }

    // Create invitation
    const invitation = await Invitation.create({
      senderId,
      receiverId: userId,
      receiverPhone: phone,
      receiverEmail: email,
      partyId: id,
      type: 'party',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    // If user ID is provided, send push notification
    if (userId) {
      // Get user details
      const user = await User.findById(userId).select('fcmTokens settings.notifications');
      
      if (user && user.settings.notifications && user.fcmTokens && user.fcmTokens.length > 0) {
        const notificationMessage = `${req.user.username} invited you to join ${party.name}`;
        
        // Send push notification to all user's devices
        user.fcmTokens.forEach((token) => {
          sendPushNotification(
            token,
            'House Party',
            notificationMessage,
            {
              type: 'party_invitation',
              partyId: party._id.toString(),
              invitationId: invitation._id.toString(),
            }
          );
        });
      }
    }

    // TODO: If phone or email is provided, send SMS or email invitation

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully',
      invitation,
    });
  } catch (error: any) {
    logger.error(`Invite to party error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation',
    });
  }
};

