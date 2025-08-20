import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import videoService from '../../services/video';
import api from '../../api';

// Define route params type
type VideoChatRouteParams = {
  partyId: string;
};

type VideoChatRouteProp = RouteProp<{ VideoChat: VideoChatRouteParams }, 'VideoChat'>;

const VideoChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<VideoChatRouteProp>();
  const { user } = useAuthStore();

  const { partyId } = route.params || { partyId: '' };

  const [participants, setParticipants] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partyDetails, setPartyDetails] = useState<any>(null);

  // Initialize video service and join channel
  useEffect(() => {
    const initVideo = async () => {
      try {
        // Get party details
        const response = await api.get(`/parties/${partyId}`);
        setPartyDetails(response.data.party);

        // Initialize video service
        await videoService.init(process.env.AGORA_APP_ID || '');

        // Set up event listeners
        videoService.on('UserJoined', handleUserJoined);
        videoService.on('UserOffline', handleUserOffline);
        videoService.on('JoinChannelSuccess', handleJoinSuccess);
        videoService.on('Error', handleError);

        // Join channel
        await videoService.joinChannel(partyId, user?._id ? parseInt(user._id.substring(0, 8), 16) : 0);

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize video service:', error);
        Alert.alert(
          'Error',
          'Failed to join video chat. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    };

    initVideo();

    // Handle back button on Android
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleLeaveParty();
        return true;
      }
    );

    // Clean up
    return () => {
      videoService.cleanup();
      backHandler.remove();
    };
  }, []);

  // Handle user joined event
  const handleUserJoined = (uid: number, elapsed: number) => {
    console.log('User joined:', uid);
    setParticipants((prev) => {
      if (prev.includes(uid)) {
        return prev;
      }
      return [...prev, uid];
    });
  };

  // Handle user offline event
  const handleUserOffline = (uid: number, reason: number) => {
    console.log('User offline:', uid);
    setParticipants((prev) => prev.filter((id) => id !== uid));
  };

  // Handle join success event
  const handleJoinSuccess = (channel: string, uid: number, elapsed: number) => {
    console.log('Join channel success:', channel, uid);
    setIsJoined(true);
    setParticipants((prev) => {
      if (prev.includes(uid)) {
        return prev;
      }
      return [...prev, uid];
    });
  };

  // Handle error event
  const handleError = (error: any) => {
    console.error('Agora error:', error);
    Alert.alert('Error', 'An error occurred in the video chat.');
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    try {
      await videoService.toggleMicrophone(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  // Toggle camera
  const toggleCamera = async () => {
    try {
      await videoService.toggleCamera(!isCameraOff);
      setIsCameraOff(!isCameraOff);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };

  // Switch camera
  const switchCamera = async () => {
    try {
      await videoService.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  // Leave party
  const handleLeaveParty = async () => {
    try {
      // Leave channel
      await videoService.leaveChannel();
      
      // Leave party on backend
      await api.post(`/parties/${partyId}/leave`);
      
      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Failed to leave party:', error);
      navigation.goBack();
    }
  };

  // Render video views
  const renderVideoViews = () => {
    // Calculate grid dimensions based on number of participants
    const totalParticipants = participants.length;
    let columns = 1;
    
    if (totalParticipants > 1 && totalParticipants <= 4) {
      columns = 2;
    } else if (totalParticipants > 4) {
      columns = 3;
    }

    // Calculate item dimensions
    const itemWidth = `${100 / columns}%`;
    const itemHeight = totalParticipants <= 4 ? '50%' : '33.33%';

    return (
      <View style={styles.videoContainer}>
        {/* Local Video */}
        <View
          style={[
            styles.videoItem,
            { width: itemWidth, height: itemHeight },
          ]}
        >
          {!isCameraOff ? (
            videoService.getLocalVideoView()
          ) : (
            <View style={styles.cameraOffContainer}>
              <Ionicons name="person" size={50} color="#fff" />
              <Text style={styles.cameraOffText}>Camera Off</Text>
            </View>
          )}
          <View style={styles.nameTag}>
            <Text style={styles.nameText}>You</Text>
          </View>
        </View>

        {/* Remote Videos */}
        {participants
          .filter((uid) => uid !== (user?._id ? parseInt(user._id.substring(0, 8), 16) : 0))
          .map((uid) => (
            <View
              key={uid}
              style={[
                styles.videoItem,
                { width: itemWidth, height: itemHeight },
              ]}
            >
              {videoService.getRemoteVideoView(uid)}
              <View style={styles.nameTag}>
                <Text style={styles.nameText}>User {uid}</Text>
              </View>
            </View>
          ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Joining video chat...</Text>
        </View>
      ) : (
        <>
          {/* Party Info */}
          <View style={styles.header}>
            <Text style={styles.partyName}>
              {partyDetails?.name || 'Video Chat'}
            </Text>
            <Text style={styles.participantsCount}>
              {participants.length} {participants.length === 1 ? 'person' : 'people'}
            </Text>
          </View>

          {/* Video Views */}
          {renderVideoViews()}

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMicrophone}
            >
              <Ionicons
                name={isMuted ? 'mic-off' : 'mic'}
                size={24}
                color={isMuted ? '#fff' : '#333'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
              onPress={toggleCamera}
            >
              <Ionicons
                name={isCameraOff ? 'videocam-off' : 'videocam'}
                size={24}
                color={isCameraOff ? '#fff' : '#333'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={switchCamera}
            >
              <Ionicons name="camera-reverse" size={24} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={handleLeaveParty}
            >
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
  },
  header: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  participantsCount: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  videoContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoItem: {
    overflow: 'hidden',
    position: 'relative',
  },
  nameTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  nameText: {
    color: '#fff',
    fontSize: 12,
  },
  cameraOffContainer: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOffText: {
    color: '#fff',
    marginTop: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#6200ee',
  },
  endCallButton: {
    backgroundColor: '#ff3b30',
  },
});

export default VideoChatScreen;

