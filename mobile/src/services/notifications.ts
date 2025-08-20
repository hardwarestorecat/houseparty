import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  // Initialize the notification service
  public init = async () => {
    // Check if device is a physical device
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return;
    }

    // Check if permission is granted
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    this.expoPushToken = tokenData.data;

    // Save token to AsyncStorage
    await AsyncStorage.setItem('expoPushToken', this.expoPushToken);

    // Register token with backend
    this.registerTokenWithBackend();

    // Set up notification handlers
    this.setupNotificationHandlers();

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await this.setupAndroidChannel();
    }
  };

  // Clean up resources
  public cleanup = () => {
    // Remove notification listeners
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  };

  // Send local notification
  public sendLocalNotification = async (
    title: string,
    body: string,
    data: any = {}
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // Send immediately
    });
  };

  // Register token with backend
  private registerTokenWithBackend = async () => {
    if (!this.expoPushToken) return;

    try {
      await api.post('/users/fcm-token', {
        token: this.expoPushToken,
      });
      console.log('FCM token registered with backend');
    } catch (error) {
      console.error('Failed to register FCM token with backend:', error);
    }
  };

  // Set up notification handlers
  private setupNotificationHandlers = () => {
    // Handle received notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Handle notification responses (when user taps notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response received:', response);
        this.handleNotificationResponse(response);
      }
    );
  };

  // Set up Android notification channel
  private setupAndroidChannel = async () => {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('house-entry', {
      name: 'House Entry',
      description: 'Notifications when friends enter the house',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });

    await Notifications.setNotificationChannelAsync('invitations', {
      name: 'Invitations',
      description: 'Notifications for party invitations',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
    });
  };

  // Handle notification response
  private handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Handle different notification types
    switch (data.type) {
      case 'house_entry':
        // Handle house entry notification
        this.handleHouseEntryNotification(data);
        break;
      case 'invitation':
        // Handle invitation notification
        this.handleInvitationNotification(data);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  // Handle house entry notification
  private handleHouseEntryNotification = (data: any) => {
    // TODO: Navigate to home screen or video chat
    console.log('Handling house entry notification:', data);
  };

  // Handle invitation notification
  private handleInvitationNotification = (data: any) => {
    // TODO: Navigate to invitation screen or directly join video chat
    console.log('Handling invitation notification:', data);
  };
}

export default new NotificationService();

