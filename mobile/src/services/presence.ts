import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class PresenceService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private appState: AppStateStatus = 'active';
  private listeners: { [key: string]: Function[] } = {};

  // Initialize the presence service
  public init = async (serverUrl: string) => {
    // Get user ID from AsyncStorage
    this.userId = await AsyncStorage.getItem('userId');
    
    if (!this.userId) {
      console.error('User ID not found. Cannot initialize presence service.');
      return;
    }

    // Connect to Socket.IO server
    this.socket = io(serverUrl, {
      auth: {
        userId: this.userId,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Set up event listeners
    this.setupSocketListeners();
    
    // Set up app state listener
    AppState.addEventListener('change', this.handleAppStateChange);
    
    // Enter the house when app is active
    if (this.appState === 'active') {
      this.enterHouse();
    }
  };

  // Clean up resources
  public cleanup = () => {
    // Remove app state listener
    AppState.removeEventListener('change', this.handleAppStateChange);
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  };

  // Enter the house
  public enterHouse = () => {
    if (this.socket && this.userId) {
      this.socket.emit('enter_house', this.userId);
    }
  };

  // Leave the house
  public leaveHouse = () => {
    if (this.socket && this.userId) {
      this.socket.emit('leave_house', this.userId);
    }
  };

  // Get users in the house
  public getUsersInHouse = (callback: (users: any[]) => void) => {
    if (this.socket) {
      this.socket.emit('get_users_in_house', (users: any[]) => {
        callback(users);
      });
    } else {
      callback([]);
    }
  };

  // Add event listener
  public on = (event: string, callback: Function) => {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    if (this.socket) {
      this.socket.on(event, (...args) => {
        callback(...args);
      });
    }
  };

  // Remove event listener
  public off = (event: string, callback: Function) => {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
    
    if (this.socket) {
      this.socket.off(event);
      
      // Re-add remaining listeners
      this.listeners[event]?.forEach((cb) => {
        this.socket?.on(event, (...args) => {
          cb(...args);
        });
      });
    }
  };

  // Handle app state changes
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      this.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to the foreground
      this.enterHouse();
    } else if (
      this.appState === 'active' &&
      nextAppState.match(/inactive|background/)
    ) {
      // App has gone to the background
      this.leaveHouse();
    }
    
    this.appState = nextAppState;
  };

  // Set up socket event listeners
  private setupSocketListeners = () => {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to presence server');
      this.enterHouse();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from presence server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // User events
    this.socket.on('user_entered', (user) => {
      console.log('User entered:', user);
      // Notify listeners
      this.listeners['user_entered']?.forEach((callback) => {
        callback(user);
      });
    });

    this.socket.on('user_left', (user) => {
      console.log('User left:', user);
      // Notify listeners
      this.listeners['user_left']?.forEach((callback) => {
        callback(user);
      });
    });

    // Party events
    this.socket.on('party_created', (party) => {
      console.log('Party created:', party);
      // Notify listeners
      this.listeners['party_created']?.forEach((callback) => {
        callback(party);
      });
    });

    this.socket.on('party_ended', (party) => {
      console.log('Party ended:', party);
      // Notify listeners
      this.listeners['party_ended']?.forEach((callback) => {
        callback(party);
      });
    });

    // Invitation events
    this.socket.on('invitation_received', (invitation) => {
      console.log('Invitation received:', invitation);
      // Notify listeners
      this.listeners['invitation_received']?.forEach((callback) => {
        callback(invitation);
      });
    });
  };
}

export default new PresenceService();

