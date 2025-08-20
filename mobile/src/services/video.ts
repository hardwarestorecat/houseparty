import { Platform } from 'react-native';
import RtcEngine, {
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode,
  ChannelProfile,
  ClientRole,
  VideoEncoderConfiguration,
  VideoOutputOrientationMode,
  DegradationPreference,
} from 'react-native-agora';
import { EventEmitter } from 'events';

/**
 * Video service for Agora.io integration
 */
class VideoService extends EventEmitter {
  private engine: RtcEngine | null = null;
  private initialized: boolean = false;
  private channelName: string = '';
  private uid: number = 0;

  /**
   * Initialize Agora RTC engine
   * @param appId Agora App ID
   */
  async init(appId: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create RTC engine instance
      this.engine = await RtcEngine.create(appId);

      // Enable video
      await this.engine.enableVideo();

      // Set channel profile to live broadcasting
      await this.engine.setChannelProfile(ChannelProfile.LiveBroadcasting);

      // Set client role to broadcaster
      await this.engine.setClientRole(ClientRole.Broadcaster);

      // Set video encoder configuration
      await this.engine.setVideoEncoderConfiguration({
        dimensions: {
          width: 640,
          height: 360,
        },
        frameRate: VideoEncoderConfiguration.FRAME_RATE.FRAME_RATE_FPS_15,
        orientationMode: VideoOutputOrientationMode.Adaptation,
        degradationPreference: DegradationPreference.MaintainQuality,
      });

      // Register event handlers
      this.engine.addListener('Warning', (warn) => {
        console.log('Warning', warn);
      });

      this.engine.addListener('Error', (err) => {
        console.error('Error', err);
        this.emit('Error', err);
      });

      this.engine.addListener('UserJoined', (uid, elapsed) => {
        console.log('UserJoined', uid, elapsed);
        this.emit('UserJoined', uid, elapsed);
      });

      this.engine.addListener('UserOffline', (uid, reason) => {
        console.log('UserOffline', uid, reason);
        this.emit('UserOffline', uid, reason);
      });

      this.engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
        console.log('JoinChannelSuccess', channel, uid, elapsed);
        this.emit('JoinChannelSuccess', channel, uid, elapsed);
      });

      this.engine.addListener('LeaveChannel', (stats) => {
        console.log('LeaveChannel', stats);
        this.emit('LeaveChannel', stats);
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Agora engine', error);
      throw error;
    }
  }

  /**
   * Join a channel
   * @param channelName Channel name
   * @param uid User ID (optional)
   */
  async joinChannel(channelName: string, uid: number = 0): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      this.channelName = channelName;
      this.uid = uid;

      // Join channel with token
      await this.engine.joinChannel(null, channelName, null, uid);
    } catch (error) {
      console.error('Failed to join channel', error);
      throw error;
    }
  }

  /**
   * Leave the current channel
   */
  async leaveChannel(): Promise<void> {
    if (!this.initialized || !this.engine) {
      return;
    }

    try {
      await this.engine.leaveChannel();
      this.channelName = '';
    } catch (error) {
      console.error('Failed to leave channel', error);
      throw error;
    }
  }

  /**
   * Toggle microphone
   * @param muted Whether to mute the microphone
   */
  async toggleMicrophone(muted: boolean): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      await this.engine.enableLocalAudio(!muted);
    } catch (error) {
      console.error('Failed to toggle microphone', error);
      throw error;
    }
  }

  /**
   * Toggle camera
   * @param disabled Whether to disable the camera
   */
  async toggleCamera(disabled: boolean): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      await this.engine.enableLocalVideo(!disabled);
    } catch (error) {
      console.error('Failed to toggle camera', error);
      throw error;
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      await this.engine.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera', error);
      throw error;
    }
  }

  /**
   * Get local video view component
   * @returns RtcLocalView.SurfaceView component
   */
  getLocalVideoView() {
    if (!this.initialized) {
      return null;
    }

    return (
      <RtcLocalView.SurfaceView
        style={{ flex: 1 }}
        channelId={this.channelName}
        renderMode={VideoRenderMode.Hidden}
      />
    );
  }

  /**
   * Get remote video view component for a specific user
   * @param uid Remote user ID
   * @returns RtcRemoteView.SurfaceView component
   */
  getRemoteVideoView(uid: number) {
    if (!this.initialized) {
      return null;
    }

    return (
      <RtcRemoteView.SurfaceView
        style={{ flex: 1 }}
        uid={uid}
        channelId={this.channelName}
        renderMode={VideoRenderMode.Hidden}
        zOrderMediaOverlay={true}
      />
    );
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (!this.initialized || !this.engine) {
      return;
    }

    try {
      // Leave channel
      await this.engine.leaveChannel();

      // Remove all event listeners
      this.engine.removeAllListeners();

      // Destroy engine instance
      await RtcEngine.destroy();

      this.engine = null;
      this.initialized = false;
    } catch (error) {
      console.error('Failed to clean up Agora engine', error);
    }
  }
}

export default new VideoService();

