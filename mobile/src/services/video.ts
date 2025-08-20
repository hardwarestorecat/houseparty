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
  BeautyOptions,
  LighteningContrastLevel,
  AudioProfile,
  AudioScenario,
} from 'react-native-agora';
import { EventEmitter } from 'events';
import { useAuthStore } from '../store/authStore';

/**
 * Video service for Agora.io integration
 */
class VideoService extends EventEmitter {
  private engine: RtcEngine | null = null;
  private initialized: boolean = false;
  private channelName: string = '';
  private uid: number = 0;
  private videoQuality: string = 'standard';
  private audioQuality: string = 'standard';
  private dataUsage: string = 'balanced';
  private beautyEnabled: boolean = false;

  /**
   * Initialize Agora RTC engine
   * @param appId Agora App ID
   */
  async init(appId: string): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Get user settings
      const authStore = useAuthStore.getState();
      if (authStore.user && authStore.user.settings) {
        this.videoQuality = authStore.user.settings.videoQuality || 'standard';
        this.audioQuality = authStore.user.settings.audioQuality || 'standard';
        this.dataUsage = authStore.user.settings.dataUsage || 'balanced';
      }

      // Create RTC engine instance
      this.engine = await RtcEngine.create(appId);

      // Enable video
      await this.engine.enableVideo();

      // Set channel profile to live broadcasting
      await this.engine.setChannelProfile(ChannelProfile.LiveBroadcasting);

      // Set client role to broadcaster
      await this.engine.setClientRole(ClientRole.Broadcaster);

      // Configure video based on quality settings
      await this.configureVideoQuality(this.videoQuality);

      // Configure audio based on quality settings
      await this.configureAudioQuality(this.audioQuality);

      // Configure data usage
      await this.configureDataUsage(this.dataUsage);

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

      this.engine.addListener('NetworkQuality', (uid, txQuality, rxQuality) => {
        console.log('NetworkQuality', uid, txQuality, rxQuality);
        this.emit('NetworkQuality', uid, txQuality, rxQuality);
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Agora engine', error);
      throw error;
    }
  }

  /**
   * Configure video quality
   * @param quality Video quality (low, standard, high)
   */
  private async configureVideoQuality(quality: string): Promise<void> {
    if (!this.engine) return;

    let config: VideoEncoderConfiguration = {
      orientationMode: VideoOutputOrientationMode.Adaptation,
      degradationPreference: DegradationPreference.MaintainQuality,
    };

    switch (quality) {
      case 'low':
        config = {
          ...config,
          dimensions: {
            width: 320,
            height: 180,
          },
          frameRate: VideoEncoderConfiguration.FRAME_RATE.FRAME_RATE_FPS_15,
          bitrate: 400,
        };
        break;
      case 'high':
        config = {
          ...config,
          dimensions: {
            width: 1280,
            height: 720,
          },
          frameRate: VideoEncoderConfiguration.FRAME_RATE.FRAME_RATE_FPS_30,
          bitrate: 2000,
        };
        break;
      case 'standard':
      default:
        config = {
          ...config,
          dimensions: {
            width: 640,
            height: 360,
          },
          frameRate: VideoEncoderConfiguration.FRAME_RATE.FRAME_RATE_FPS_15,
          bitrate: 1000,
        };
        break;
    }

    await this.engine.setVideoEncoderConfiguration(config);
  }

  /**
   * Configure audio quality
   * @param quality Audio quality (low, standard, high)
   */
  private async configureAudioQuality(quality: string): Promise<void> {
    if (!this.engine) return;

    switch (quality) {
      case 'low':
        await this.engine.setAudioProfile(
          AudioProfile.SpeechStandard,
          AudioScenario.ChatRoom
        );
        break;
      case 'high':
        await this.engine.setAudioProfile(
          AudioProfile.MusicHighQualityStereo,
          AudioScenario.GameStreaming
        );
        break;
      case 'standard':
      default:
        await this.engine.setAudioProfile(
          AudioProfile.MusicStandard,
          AudioScenario.ChatRoomEntertainment
        );
        break;
    }
  }

  /**
   * Configure data usage
   * @param usage Data usage (low, balanced, high)
   */
  private async configureDataUsage(usage: string): Promise<void> {
    if (!this.engine) return;

    switch (usage) {
      case 'low':
        // Enable dual stream mode with lower bitrate for subscribers
        await this.engine.enableDualStreamMode(true);
        await this.engine.setRemoteSubscribeFallbackOption(1); // Stream low when network is poor
        await this.engine.setLocalPublishFallbackOption(1); // Fallback to audio-only when network is poor
        break;
      case 'high':
        // Disable dual stream mode for highest quality
        await this.engine.enableDualStreamMode(false);
        await this.engine.setRemoteSubscribeFallbackOption(0); // Disable fallback
        await this.engine.setLocalPublishFallbackOption(0); // Disable fallback
        break;
      case 'balanced':
      default:
        // Enable dual stream mode with moderate settings
        await this.engine.enableDualStreamMode(true);
        await this.engine.setRemoteSubscribeFallbackOption(1); // Stream low when network is poor
        await this.engine.setLocalPublishFallbackOption(0); // Don't fallback for local publishing
        break;
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
   * Toggle beauty effects
   * @param enabled Whether to enable beauty effects
   */
  async toggleBeautyEffects(enabled: boolean): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      this.beautyEnabled = enabled;
      
      if (enabled) {
        // Enable beauty effects with moderate settings
        const options: BeautyOptions = {
          lighteningContrastLevel: LighteningContrastLevel.Normal,
          lighteningLevel: 0.7,
          smoothnessLevel: 0.5,
          rednessLevel: 0.1,
        };
        
        await this.engine.setBeautyEffectOptions(true, options);
      } else {
        // Disable beauty effects
        await this.engine.setBeautyEffectOptions(false, {});
      }
    } catch (error) {
      console.error('Failed to toggle beauty effects', error);
      throw error;
    }
  }

  /**
   * Update video quality settings
   * @param quality Video quality (low, standard, high)
   */
  async updateVideoQuality(quality: string): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      this.videoQuality = quality;
      await this.configureVideoQuality(quality);
    } catch (error) {
      console.error('Failed to update video quality', error);
      throw error;
    }
  }

  /**
   * Update audio quality settings
   * @param quality Audio quality (low, standard, high)
   */
  async updateAudioQuality(quality: string): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      this.audioQuality = quality;
      await this.configureAudioQuality(quality);
    } catch (error) {
      console.error('Failed to update audio quality', error);
      throw error;
    }
  }

  /**
   * Update data usage settings
   * @param usage Data usage (low, balanced, high)
   */
  async updateDataUsage(usage: string): Promise<void> {
    if (!this.initialized || !this.engine) {
      throw new Error('Agora engine not initialized');
    }

    try {
      this.dataUsage = usage;
      await this.configureDataUsage(usage);
    } catch (error) {
      console.error('Failed to update data usage', error);
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
