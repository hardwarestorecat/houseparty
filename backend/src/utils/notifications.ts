import axios from 'axios';
import config from '../config/config';
import logger from './logger';
import firebaseService from '../services/firebase.service';

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
    // Convert data to string values (FCM v1 API requirement)
    const stringData: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    // Use new Firebase service with FCM v1 API
    return await firebaseService.sendPushNotification(token, title, body, stringData);
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
    // Convert data to string values (FCM v1 API requirement)
    const stringData: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    // Use new Firebase service with FCM v1 API
    return await firebaseService.sendMultiplePushNotifications(tokens, title, body, stringData);
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
    // Convert data to string values (FCM v1 API requirement)
    const stringData: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }

    // Use new Firebase service with FCM v1 API
    return await firebaseService.notifyFriends(userId, title, body, stringData);
  } catch (error: any) {
    logger.error(`Notify friends error: ${error.message}`);
    return 0;
  }
};
