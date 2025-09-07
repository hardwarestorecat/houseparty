import axios from 'axios';
import { JWT } from 'google-auth-library';
import config from '../config/config';
import logger from '../utils/logger';

interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

interface FCMMessage {
  message: {
    token?: string;
    topic?: string;
    condition?: string;
    notification?: {
      title?: string;
      body?: string;
      image?: string;
    };
    data?: { [key: string]: string };
    android?: {
      priority?: 'NORMAL' | 'HIGH';
      notification?: {
        title?: string;
        body?: string;
        icon?: string;
        color?: string;
        sound?: string;
        tag?: string;
        click_action?: string;
        body_loc_key?: string;
        body_loc_args?: string[];
        title_loc_key?: string;
        title_loc_args?: string[];
        channel_id?: string;
        ticker?: string;
        sticky?: boolean;
        event_time?: string;
        local_only?: boolean;
        notification_priority?: 'PRIORITY_UNSPECIFIED' | 'PRIORITY_MIN' | 'PRIORITY_LOW' | 'PRIORITY_DEFAULT' | 'PRIORITY_HIGH' | 'PRIORITY_MAX';
        default_sound?: boolean;
        default_vibrate_timings?: boolean;
        default_light_settings?: boolean;
        vibrate_timings?: string[];
        visibility?: 'VISIBILITY_UNSPECIFIED' | 'PRIVATE' | 'PUBLIC' | 'SECRET';
        notification_count?: number;
      };
    };
    apns?: {
      headers?: { [key: string]: string };
      payload?: {
        aps?: {
          alert?: {
            title?: string;
            subtitle?: string;
            body?: string;
            'launch-image'?: string;
            'title-loc-key'?: string;
            'title-loc-args'?: string[];
            'action-loc-key'?: string;
            'loc-key'?: string;
            'loc-args'?: string[];
          };
          badge?: number;
          sound?: string | {
            critical?: number;
            name?: string;
            volume?: number;
          };
          'thread-id'?: string;
          category?: string;
          'content-available'?: number;
          'mutable-content'?: number;
          'target-content-id'?: string;
          'interruption-level'?: 'passive' | 'active' | 'time-sensitive' | 'critical';
          'relevance-score'?: number;
          'filter-criteria'?: string;
          'stale-date'?: number;
          'content-state'?: { [key: string]: any };
          timestamp?: number;
          event?: 'update' | 'end';
          'dismissal-date'?: number;
          attributes?: {
            'attributes-type'?: number;
            'display-name'?: string;
            'person-id-type'?: number;
            'person-id'?: string;
          };
          'attributes-type'?: number;
          'display-name'?: string;
          'person-id-type'?: number;
          'person-id'?: string;
        };
        [key: string]: any;
      };
    };
    webpush?: {
      headers?: { [key: string]: string };
      data?: { [key: string]: string };
      notification?: {
        title?: string;
        body?: string;
        icon?: string;
        actions?: Array<{
          action: string;
          title: string;
          icon?: string;
        }>;
        badge?: string;
        data?: any;
        dir?: 'auto' | 'ltr' | 'rtl';
        image?: string;
        lang?: string;
        renotify?: boolean;
        require_interaction?: boolean;
        silent?: boolean;
        tag?: string;
        timestamp?: number;
        vibrate?: number[];
      };
      fcm_options?: {
        link?: string;
        analytics_label?: string;
      };
    };
    fcm_options?: {
      analytics_label?: string;
    };
  };
}

class FirebaseService {
  private serviceAccount: FirebaseServiceAccount | null = null;
  private jwtClient: JWT | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.initializeServiceAccount();
  }

  private initializeServiceAccount() {
    try {
      // Parse the service account from environment variable or config
      const serviceAccountJson = config.firebase.serviceAccount || process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccountJson) {
        logger.error('Firebase service account not configured');
        return;
      }

      this.serviceAccount = typeof serviceAccountJson === 'string' 
        ? JSON.parse(serviceAccountJson) 
        : serviceAccountJson;

      // Initialize JWT client
      this.jwtClient = new JWT({
        email: this.serviceAccount.client_email,
        key: this.serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      });

      logger.info('Firebase service account initialized successfully');
    } catch (error: any) {
      logger.error(`Failed to initialize Firebase service account: ${error.message}`);
    }
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      if (!this.jwtClient) {
        logger.error('JWT client not initialized');
        return null;
      }

      // Check if token is still valid (with 5 minute buffer)
      const now = Date.now();
      if (this.accessToken && this.tokenExpiry > now + 5 * 60 * 1000) {
        return this.accessToken;
      }

      // Get new access token
      const credentials = await this.jwtClient.authorize();
      this.accessToken = credentials.access_token || null;
      this.tokenExpiry = credentials.expiry_date || 0;

      if (!this.accessToken) {
        logger.error('Failed to get access token from JWT client');
        return null;
      }

      logger.info('Firebase access token refreshed successfully');
      return this.accessToken;
    } catch (error: any) {
      logger.error(`Failed to get Firebase access token: ${error.message}`);
      return null;
    }
  }

  /**
   * Send push notification using FCM v1 API
   * @param token FCM token
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data to send with notification
   * @returns Promise<boolean> Success status
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: { [key: string]: string } = {}
  ): Promise<boolean> {
    try {
      if (!this.serviceAccount) {
        logger.error('Firebase service account not configured');
        return false;
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get Firebase access token');
        return false;
      }

      // Prepare FCM v1 message
      const message: FCMMessage = {
        message: {
          token,
          notification: {
            title,
            body,
          },
          data,
          android: {
            priority: 'HIGH',
            notification: {
              sound: 'default',
              channel_id: 'houseparty_notifications',
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title,
                  body,
                },
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      };

      // Send notification using FCM v1 API
      const response = await axios.post(
        `https://fcm.googleapis.com/v1/projects/${this.serviceAccount.project_id}/messages:send`,
        message,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        logger.info(`Push notification sent successfully to ${token}`);
        return true;
      } else {
        logger.warn(`Failed to send push notification to ${token}: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`Push notification error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }

  /**
   * Send push notifications to multiple FCM tokens
   * @param tokens Array of FCM tokens
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data to send with notification
   * @returns Promise<number> Number of successful notifications
   */
  async sendMultiplePushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data: { [key: string]: string } = {}
  ): Promise<number> {
    try {
      if (!tokens || tokens.length === 0) {
        return 0;
      }

      // Send notifications concurrently with a limit to avoid rate limiting
      const batchSize = 10;
      let successCount = 0;

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batch = tokens.slice(i, i + batchSize);
        const promises = batch.map(token => 
          this.sendPushNotification(token, title, body, data)
        );

        const results = await Promise.all(promises);
        successCount += results.filter(result => result).length;

        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < tokens.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info(`Push notifications sent successfully to ${successCount}/${tokens.length} devices`);
      return successCount;
    } catch (error: any) {
      logger.error(`Multiple push notifications error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Send push notification to all user's friends
   * @param userId User ID
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data to send with notification
   * @returns Promise<number> Number of successful notifications
   */
  async notifyFriends(
    userId: string,
    title: string,
    body: string,
    data: { [key: string]: string } = {}
  ): Promise<number> {
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
      return await this.sendMultiplePushNotifications(tokens, title, body, data);
    } catch (error: any) {
      logger.error(`Notify friends error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Send notification to a topic
   * @param topic Topic name
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data to send with notification
   * @returns Promise<boolean> Success status
   */
  async sendTopicNotification(
    topic: string,
    title: string,
    body: string,
    data: { [key: string]: string } = {}
  ): Promise<boolean> {
    try {
      if (!this.serviceAccount) {
        logger.error('Firebase service account not configured');
        return false;
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get Firebase access token');
        return false;
      }

      // Prepare FCM v1 message for topic
      const message: FCMMessage = {
        message: {
          topic,
          notification: {
            title,
            body,
          },
          data,
          android: {
            priority: 'HIGH',
            notification: {
              sound: 'default',
              channel_id: 'houseparty_notifications',
            },
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title,
                  body,
                },
                sound: 'default',
                badge: 1,
              },
            },
          },
        },
      };

      // Send notification using FCM v1 API
      const response = await axios.post(
        `https://fcm.googleapis.com/v1/projects/${this.serviceAccount.project_id}/messages:send`,
        message,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200) {
        logger.info(`Topic notification sent successfully to ${topic}`);
        return true;
      } else {
        logger.warn(`Failed to send topic notification to ${topic}: ${JSON.stringify(response.data)}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`Topic notification error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      return false;
    }
  }
}

// Export singleton instance
export default new FirebaseService();
