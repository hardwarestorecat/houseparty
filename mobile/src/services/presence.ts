import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { useAuthStore } from '../store/authStore';

/**
 * Presence service for real-time user presence
 */
class PresenceService extends EventEmitter {
  private socket: Socket | null = null;
  private initialized: boolean = false;
  private userId: string = '';
  private baseUrl: string = '';

  /**
   * Initialize Socket.IO connection
   * @param baseUrl Base URL for Socket.IO server
   */
  async init(baseUrl: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.baseUrl = baseUrl;
      
      // Get user ID from auth store
      const authStore = useAuthStore.getState();
      this.userId = authStore.user?._id || '';

      if (!this.userId) {
        throw new Error('User ID not available');
      }

      // Get access token from auth store
      const accessToken = authStore.accessToken;

      if (!accessToken) {
        throw new Error('Access token not available');
      }

      // Connect to Socket.IO server
      this.socket = io(baseUrl, {
        auth: {
          token: accessToken,
          userId: this.userId,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Register event handlers
      this.socket.on('connect', this.handleConnect.bind(this));
      this.socket.on('disconnect', this.handleDisconnect.bind(this));
      this.socket.on('connect_error', this.handleConnectError.bind(this));
      this.socket.on('user_entered', this.handleUserEntered.bind(this));
      this.socket.on('user_left', this.handleUserLeft.bind(this));
      this.socket.on('party_created', this.handlePartyCreated.bind(this));
      this.socket.on('party_ended', this.handlePartyEnded.bind(this));

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize presence service', error);
      throw error;
    }
  }

  /**
   * Handle socket connect event
   */
  private handleConnect(): void {
    console.log('Socket connected');
    
    // Enter the house
    this.enterHouse();
  }

  /**
   * Handle socket disconnect event
   */
  private handleDisconnect(): void {
    console.log('Socket disconnected');
    
    // Leave the house
    this.leaveHouse();
  }

  /**
   * Handle socket connect error
   * @param error Connection error
   */
  private handleConnectError(error: Error): void {
    console.error('Socket connection error', error);
    this.emit('connect_error', error);
  }

  /**
   * Handle user entered event
   * @param data Event data
   */
  private handleUserEntered(data: any): void {
    console.log('User entered', data);
    this.emit('user_entered', data);
  }

  /**
   * Handle user left event
   * @param data Event data
   */
  private handleUserLeft(data: any): void {
    console.log('User left', data);
    this.emit('user_left', data);
  }

  /**
   * Handle party created event
   * @param data Event data
   */
  private handlePartyCreated(data: any): void {
    console.log('Party created', data);
    this.emit('party_created', data);
  }

  /**
   * Handle party ended event
   * @param data Event data
   */
  private handlePartyEnded(data: any): void {
    console.log('Party ended', data);
    this.emit('party_ended', data);
  }

  /**
   * Enter the house (mark user as present)
   */
  enterHouse(): void {
    if (!this.initialized || !this.socket) {
      console.warn('Presence service not initialized');
      return;
    }

    this.socket.emit('enter_house', this.userId);
  }

  /**
   * Leave the house (mark user as absent)
   */
  leaveHouse(): void {
    if (!this.initialized || !this.socket) {
      return;
    }

    this.socket.emit('leave_house', this.userId);
  }

  /**
   * Get users currently in the house
   * @param callback Callback function to receive user IDs
   */
  getUsersInHouse(callback: (userIds: string[]) => void): void {
    if (!this.initialized || !this.socket) {
      console.warn('Presence service not initialized');
      callback([]);
      return;
    }

    this.socket.emit('get_users_in_house', callback);
  }

  /**
   * Reconnect to the server with a new token
   * @param accessToken New access token
   */
  reconnect(accessToken: string): void {
    if (!this.socket) {
      this.init(this.baseUrl);
      return;
    }

    // Disconnect and reconnect with new token
    this.socket.disconnect();
    
    this.socket.auth = {
      token: accessToken,
      userId: this.userId,
    };
    
    this.socket.connect();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (!this.initialized || !this.socket) {
      return;
    }

    // Leave the house before disconnecting
    this.leaveHouse();

    // Remove all event listeners
    this.socket.removeAllListeners();

    // Disconnect socket
    this.socket.disconnect();

    this.socket = null;
    this.initialized = false;
  }
}

export default new PresenceService();

