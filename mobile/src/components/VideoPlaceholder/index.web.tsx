import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VideoPlaceholderProps {
  isLocal?: boolean;
  username?: string;
}

const VideoPlaceholder: React.FC<VideoPlaceholderProps> = ({ isLocal = false, username = 'User' }) => {
  return (
    <View style={styles.container}>
      <Ionicons name={isLocal ? 'person-circle' : 'people'} size={50} color="#ffffff" />
      <Text style={styles.text}>{isLocal ? 'You' : username}</Text>
      <Text style={styles.subtext}>{isLocal ? 'Local Video' : 'Remote Video'}</Text>
      <Text style={styles.note}>Video preview not available on web</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtext: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 5,
  },
  note: {
    color: '#999999',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default VideoPlaceholder;
