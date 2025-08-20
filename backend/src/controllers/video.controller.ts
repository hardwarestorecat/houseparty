import { Request, Response } from 'express';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';
import config from '../config/config';
import Party from '../models/Party';
import User from '../models/User';
import logger from '../utils/logger';

/**
 * Generate an Agora token for video chat
 * @route POST /api/video/token
 * @access Private
 */
export const generateToken = async (req: Request, res: Response) => {
  try {
    const { channelName, uid } = req.body;
    const userId = req.user._id;

    if (!channelName) {
      return res.status(400).json({
        success: false,
        error: 'Channel name is required',
      });
    }

    // Use user ID as UID if not provided
    const userUid = uid || parseInt(userId.toString().substring(0, 8), 16);

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

    // Return the token
    res.status(200).json({
      success: true,
      token,
      uid: userUid,
      channelName,
      expiresIn: expirationTimeInSeconds,
    });
  } catch (error: any) {
    logger.error(`Token generation error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
    });
  }
};

/**
 * Get active video chat parties
 * @route GET /api/video/parties
 * @access Private
 */
export const getActiveParties = async (req: Request, res: Response) => {
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

    // Find active parties where host or participants include user's friends
    const parties = await Party.find({
      isActive: true,
      $or: [
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
    logger.error(`Get active parties error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get active parties',
    });
  }
};

/**
 * Join a video chat party
 * @route POST /api/video/parties/:id/join
 * @access Private
 */
export const joinParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the party
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
 * Leave a video chat party
 * @route POST /api/video/parties/:id/leave
 * @access Private
 */
export const leaveParty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the party
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

