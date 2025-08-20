import { Platform } from 'react-native';
import RtcEngine, {
  ChannelProfile,
  ClientRole,
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode,
} from 'react-native-agora';
import api from '../api';

class VideoService {
  private engine: RtcEngine | null = null;
  private channelId: string | null = null;
  private appId: string = '';
  private initialized: boolean = false;
  private joined: boolean = false;
  private listeners: { [key: string]: Function[] } = {};

  // Initialize the video service
  public init = async (appId: string) => {
    if (this.initialized) return;

    this.appId = appId;

    try {
      // Create RTC engine instance
      this.engine = await RtcEngine.create(appId);

      // Enable video
      await this.engine.enableVideo();

      // Set channel profile to live broadcasting
      await this.engine.setChannelProfile(ChannelProfile.LiveBroadcasting);

      // Set client role to broadcaster by default
      await this.engine.setClientRole(ClientRole.Broadcaster);

      // Register event listeners
      this.registerEventListeners();

      this.initialized = true;
      console.log('Agora engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Agora engine:', error);
      throw error;
    }
  };

  // Clean up resources
  public cleanup = async () => {
    if (this.joined) {
      await this.leaveChannel();
    }

    if (this.engine) {
      this.unregisterEventListeners();
      await this.engine.destroy();
      this.engine = null;
    }

    this.initialized = false;
    this.channelId = null;
  };

  // Join a video channel
  public joinChannel = async (channelId: string, uid: number = 0) => {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      // Get token from backend
      const response = await api.post('/video/token', {
        channelId,
        uid: uid.toString(),
      });

      const { token } = response.data;

      // Join channel
      await this.engine.joinChannel(token, channelId, null, uid);
      this.channelId = channelId;
      this.joined = true;

      console.log(`Joined channel: ${channelId}`);
    } catch (error) {
      console.error('Failed to join channel:', error);
      throw error;
    }
  };

  // Leave the current channel
  public leaveChannel = async () => {
    if (!this.joined || !this.engine) return;

    try {
      await this.engine.leaveChannel();
      this.joined = false;
      this.channelId = null;

      console.log('Left channel');
    } catch (error) {
      console.error('Failed to leave channel:', error);
      throw error;
    }
  };

  // Toggle camera
  public toggleCamera = async (enabled: boolean) => {
    if (!this.engine) return;

    try {
      await this.engine.enableLocalVideo(enabled);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
      throw error;
    }
  };

  // Toggle microphone
  public toggleMicrophone = async (enabled: boolean) => {
    if (!this.engine) return;

    try {
      await this.engine.enableLocalAudio(enabled);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
      throw error;
    }
  };

  // Switch camera
  public switchCamera = async () => {
    if (!this.engine) return;

    try {
      await this.engine.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
      throw error;
    }
  };

  // Get local video view component
  public getLocalVideoView = () => {
    return (
      <RtcLocalView.SurfaceView
        style={{ flex: 1 }}
        renderMode={VideoRenderMode.Hidden}
      />
    );
  };

  // Get remote video view component
  public getRemoteVideoView = (uid: number) => {
    return (
      <RtcRemoteView.SurfaceView
        style={{ flex: 1 }}
        uid={uid}
        renderMode={VideoRenderMode.Hidden}
        channelId={this.channelId || ''}
      />
    );
  };

  // Add event listener
  public on = (event: string, callback: Function) => {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  };

  // Remove event listener
  public off = (event: string, callback: Function) => {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  };

  // Register event listeners
  private registerEventListeners = () => {
    if (!this.engine) return;

    // User joined
    this.engine.addListener('UserJoined', (uid, elapsed) => {
      console.log('User joined:', uid, elapsed);
      this.listeners['UserJoined']?.forEach((callback) => {
        callback(uid, elapsed);
      });
    });

    // User offline
    this.engine.addListener('UserOffline', (uid, reason) => {
      console.log('User offline:', uid, reason);
      this.listeners['UserOffline']?.forEach((callback) => {
        callback(uid, reason);
      });
    });

    // Join channel success
    this.engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
      console.log('Join channel success:', channel, uid, elapsed);
      this.listeners['JoinChannelSuccess']?.forEach((callback) => {
        callback(channel, uid, elapsed);
      });
    });

    // Leave channel
    this.engine.addListener('LeaveChannel', (stats) => {
      console.log('Leave channel:', stats);
      this.listeners['LeaveChannel']?.forEach((callback) => {
        callback(stats);
      });
    });

    // Error
    this.engine.addListener('Error', (error) => {
      console.error('Agora error:', error);
      this.listeners['Error']?.forEach((callback) => {
        callback(error);
      });
    });
  };

  // Unregister event listeners
  private unregisterEventListeners = () => {
    if (!this.engine) return;

    this.engine.removeAllListeners();
  };
}

export default new VideoService();

