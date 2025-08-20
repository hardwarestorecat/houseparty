import axios from 'axios';
import config from '../config/config';
import logger from './logger';

/**
 * Send push notification using Firebase Cloud Messaging
 * @param token FCM token
 * @param title Notification title
 * @param body Notification body
 * @param data Additional data to send with notification
 * @returns Promise<boolean> Success status
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data: any = {}
): Promise<boolean> => {
  try {
    // Get Firebase server key from config
    const serverKey = config.firebase.serverKey;
    
    if (!serverKey) {
      logger.error('Firebase server key not configured');
      return false;
    }

    // Prepare notification payload
    const message = {
      to: token,
      notification: {
        title,
        body,
        sound: 'default',
      },
      data,
      priority: 'high',
    };

    // Send notification
    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      message,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
      }
    );

    // Check response
    if (response.status === 200 && response.data.success === 1) {
      logger.info(`Push notification sent successfully to ${token}`);
      return true;
    } else {
      logger.warn(`Failed to send push notification to ${token}: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error: any) {
    logger.error(`Push notification error: ${error.message}`);
    return false;
  }
};

/**
 * Send push notifications to multiple FCM tokens
 * @param tokens Array of FCM tokens
 * @param title Notification title
 * @param body Notification body
 * @param data Additional data to send with notification
 * @returns Promise<number> Number of successful notifications
 */
export const sendMultiplePushNotifications = async (
  tokens: string[],
  title: string,
  body: string,
  data: any = {}
): Promise<number> => {
  try {
    // Get Firebase server key from config
    const serverKey = config.firebase.serverKey;
    
    if (!serverKey) {
      logger.error('Firebase server key not configured');
      return 0;
    }

    // Prepare notification payload
    const message = {
      registration_ids: tokens,
      notification: {
        title,
        body,
        sound: 'default',
      },
      data,
      priority: 'high',
    };

    // Send notification
    const response = await axios.post(
      'https://fcm.googleapis.com/fcm/send',
      message,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${serverKey}`,
        },
      }
    );

    // Check response
    if (response.status === 200) {
      const successCount = response.data.success || 0;
      logger.info(`Push notifications sent successfully to ${successCount} devices`);
      return successCount;
    } else {
      logger.warn(`Failed to send push notifications: ${JSON.stringify(response.data)}`);
      return 0;
    }
  } catch (error: any) {
    logger.error(`Push notifications error: ${error.message}`);
    return 0;
  }
};

/**
 * Send push notification to all user's friends
 * @param userId User ID
 * @param title Notification title
 * @param body Notification body
 * @param data Additional data to send with notification
 * @returns Promise<number> Number of successful notifications
 */
export const notifyFriends = async (
  userId: string,
  title: string,
  body: string,
  data: any = {}
): Promise<number> => {
  try {
    // Import User model here to avoid circular dependency
    const User = require('../models/User').default;

    // Get user's friends
    const user = await User.findById(userId).select('friends');
    
    if (!user || !user.friends || user.friends.length === 0) {
      return 0;
    }

    // Get FCM tokens for friends with notifications enabled
    const friends = await User.find({
      _id: { $in: user.friends },
      'settings.notifications': true,
    }).select('fcmTokens');

    // Collect all FCM tokens
    const tokens: string[] = [];
    friends.forEach((friend: any) => {
      if (friend.fcmTokens && friend.fcmTokens.length > 0) {
        tokens.push(...friend.fcmTokens);
      }
    });

    if (tokens.length === 0) {
      return 0;
    }

    // Send notifications
    return await sendMultiplePushNotifications(tokens, title, body, data);
  } catch (error: any) {
    logger.error(`Notify friends error: ${error.message}`);
    return 0;
  }
};

