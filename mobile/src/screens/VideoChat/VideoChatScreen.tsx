import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import videoService from '../../services/video';
import api from '../../api';
import { RtcLocalView, RtcRemoteView } from 'react-native-agora';
import { useFocusEffect } from '@react-navigation/native';

// Define route params type
type VideoChatRouteParams = {
  partyId: string;
  token: string;
  uid: number;
};

type VideoChatRouteProp = RouteProp<{ VideoChat: VideoChatRouteParams }, 'VideoChat'>;

// Define participant type
interface Participant {
  uid: number;
  username?: string;
}

const VideoChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<VideoChatRouteProp>();
  const { user } = useAuthStore();

  const { partyId, token, uid } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [partyDetails, setPartyDetails] = useState<any>(null);

  // Refs
  const appIdRef = useRef<string>('');

  // Initialize video service
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        // Get Agora App ID from environment
        const response = await api.get('/config/agora');
        appIdRef.current = response.data.appId;

        // Initialize video service
        await videoService.init(appIdRef.current);

        // Add event listeners
        videoService.on('UserJoined', handleUserJoined);
        videoService.on('UserOffline', handleUserOffline);
        videoService.on('JoinChannelSuccess', handleJoinSuccess);
        videoService.on('Error', handleError);

        // Join channel
        await videoService.joinChannel(partyDetails?.channelName || `party_${partyId}`, uid);

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize video:', error);
        setError('Failed to initialize video chat. Please try again.');
        setLoading(false);
      }
    };

    // Get party details
    const getPartyDetails = async () => {
      try {
        const response = await api.get(`/parties/${partyId}`);
        setPartyDetails(response.data.party);
        
        // Initialize participants with existing party members
        const initialParticipants = response.data.party.participants.map((participant: any) => ({
          uid: parseInt(participant._id.toString().substring(0, 8), 16),
          username: participant.username,
        }));
        
        setParticipants(initialParticipants);
        
        // Initialize video after getting party details
        await initializeVideo();
      } catch (error) {
        console.error('Failed to get party details:', error);
        setError('Failed to get party details. Please try again.');
        setLoading(false);
      }
    };

    getPartyDetails();

    // Clean up
    return () => {
      videoService.removeAllListeners();
      videoService.cleanup();
    };
  }, [partyId, uid]);

  // Handle back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleLeaveParty();
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [])
  );

  // Handle user joined event
  const handleUserJoined = (remoteUid: number) => {
    console.log('User joined:', remoteUid);
    
    // Add remote user to participants
    setParticipants((prev) => {
      if (!prev.find((p) => p.uid === remoteUid)) {
        return [...prev, { uid: remoteUid }];
      }
      return prev;
    });
  };

  // Handle user offline event
  const handleUserOffline = (remoteUid: number) => {
    console.log('User offline:', remoteUid);
    
    // Remove remote user from participants
    setParticipants((prev) => prev.filter((p) => p.uid !== remoteUid));
  };

  // Handle join success event
  const handleJoinSuccess = (channel: string, uid: number) => {
    console.log('Join success:', channel, uid);
    
    // Add local user to participants if not already added
    setParticipants((prev) => {
      if (!prev.find((p) => p.uid === uid)) {
        return [...prev, { uid, username: user?.username }];
      }
      return prev;
    });
  };

  // Handle error event
  const handleError = (err: any) => {
    console.error('Video error:', err);
    setError(`Video error: ${err}`);
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

  // Invite friends
  const inviteFriends = () => {
    if (!partyDetails) return;
    
    navigation.navigate('InviteToParty' as never, {
      partyId,
      partyName: partyDetails.name,
    } as never);
  };

  // Leave party
  const handleLeaveParty = async () => {
    Alert.alert(
      'Leave Party',
      'Are you sure you want to leave this party?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            
            try {
              // Leave channel
              await videoService.leaveChannel();
              
              // Leave party on backend
              await api.post(`/parties/${partyId}/leave`);
              
              // Navigate back
              navigation.goBack();
            } catch (error) {
              console.error('Failed to leave party:', error);
              setIsLeaving(false);
              Alert.alert('Error', 'Failed to leave party. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Calculate grid dimensions based on participant count
  const getGridDimensions = () => {
    const count = participants.length;
    
    if (count <= 1) {
      return { rows: 1, cols: 1 };
    } else if (count <= 2) {
      return { rows: 1, cols: 2 };
    } else if (count <= 4) {
      return { rows: 2, cols: 2 };
    } else if (count <= 6) {
      return { rows: 2, cols: 3 };
    } else if (count <= 9) {
      return { rows: 3, cols: 3 };
    } else {
      return { rows: 3, cols: 4 };
    }
  };

  // Render video grid
  const renderVideoGrid = () => {
    const { rows, cols } = getGridDimensions();
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height - 150; // Subtract controls height
    
    const itemWidth = screenWidth / cols;
    const itemHeight = screenHeight / rows;
    
    return (
      <View style={styles.gridContainer}>
        {participants.map((participant, index) => (
          <View
            key={participant.uid}
            style={[
              styles.videoContainer,
              {
                width: itemWidth,
                height: itemHeight,
              },
            ]}
          >
            {participant.uid === uid ? (
              Platform.OS === 'web' ? (
                <View style={{ flex: 1, backgroundColor: '#333' }}>
                  {/* Web placeholder for local video */}
                  <Text style={{ color: 'white', textAlign: 'center' }}>Local Video</Text>
                </View>
              ) : (
                <RtcLocalView.SurfaceView
                  style={{ flex: 1 }}
                  channelId={partyDetails?.channelName || `party_${partyId}`}
                  renderMode={1} // VideoRenderMode.Hidden
                />
              )
            ) : (
              Platform.OS === 'web' ? (
                <View style={{ flex: 1, backgroundColor: '#333' }}>
                  {/* Web placeholder for remote video */}
                  <Text style={{ color: 'white', textAlign: 'center' }}>Remote Video</Text>
                </View>
              ) : (
                <RtcRemoteView.SurfaceView
                  style={{ flex: 1 }}
                  uid={participant.uid}
                  channelId={partyDetails?.channelName || `party_${partyId}`}
                  renderMode={1} // VideoRenderMode.Hidden
                  zOrderMediaOverlay={true}
                />
              )
            )}
            <View style={styles.nameTag}>
              <Text style={styles.nameText}>
                {participant.username || `User ${index + 1}`}
                {participant.uid === uid ? ' (You)' : ''}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Joining video chat...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color="#ff3b30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Party Info */}
      <View style={styles.header}>
        <Text style={styles.partyName}>{partyDetails?.name || 'Video Chat'}</Text>
        <Text style={styles.participantCount}>
          {participants.length} / {partyDetails?.maxParticipants || 10}
        </Text>
      </View>
      
      {/* Video Grid */}
      {renderVideoGrid()}
      
      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMicrophone}
          disabled={isLeaving}
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
          disabled={isLeaving}
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
          disabled={isLeaving || isCameraOff}
        >
          <Ionicons name="camera-reverse" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={inviteFriends}
          disabled={isLeaving}
        >
          <Ionicons name="person-add" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, styles.leaveButton]}
          onPress={handleLeaveParty}
          disabled={isLeaving}
        >
          {isLeaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="exit" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    marginTop: 20,
    marginBottom: 30,
    fontSize: 16,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  partyName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantCount: {
    color: '#fff',
    fontSize: 14,
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    overflow: 'hidden',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  nameTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  nameText: {
    color: '#fff',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  controlButtonActive: {
    backgroundColor: '#6200ee',
  },
  leaveButton: {
    backgroundColor: '#ff3b30',
  },
});

export default VideoChatScreen;
