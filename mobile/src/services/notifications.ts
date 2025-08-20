import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import api from '../api';

/**
 * Notification service for push notifications
 */
class NotificationService {
  private initialized: boolean = false;
  private expoPushToken: string = '';

  /**
   * Initialize notification service
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Check if device is supported
      if (!Device.isDevice) {
        console.warn('Push notifications are not supported in the simulator');
        return;
      }

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        experienceId: Constants.manifest?.extra?.experienceId,
      });
      
      this.expoPushToken = tokenData.data;

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Register token with backend
      await this.registerToken();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service', error);
    }
  }

  /**
   * Register push token with backend
   */
  async registerToken(): Promise<void> {
    if (!this.expoPushToken) {
      return;
    }

    try {
      const authStore = useAuthStore.getState();
      
      if (!authStore.isAuthenticated || !authStore.user) {
        return;
      }

      await api.post('/users/fcm-token', {
        token: this.expoPushToken,
      });
    } catch (error) {
      console.error('Failed to register push token', error);
    }
  }

  /**
   * Handle notification response
   * @param response Notification response
   */
  handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    console.log('Notification response:', data);
    
    // Handle different notification types
    if (data.type === 'party_invitation') {
      // Navigate to party screen
      // This will be handled by the navigation service
    } else if (data.type === 'friend_request') {
      // Navigate to friend requests screen
    } else if (data.type === 'user_entered') {
      // Navigate to home screen
    }
  }

  /**
   * Set up notification listeners
   * @param onNotification Callback for received notifications
   * @param onNotificationResponse Callback for notification responses
   * @returns Cleanup function
   */
  setupListeners(
    onNotification?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    // Set up notification received listener
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotification) {
          onNotification(notification);
        }
      }
    );

    // Set up notification response listener
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (onNotificationResponse) {
          onNotificationResponse(response);
        } else {
          this.handleNotificationResponse(response);
        }
      }
    );

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  /**
   * Send local notification
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null,
    });
  }

  /**
   * Get push token
   * @returns Expo push token
   */
  getPushToken(): string {
    return this.expoPushToken;
  }
}

export default new NotificationService();

