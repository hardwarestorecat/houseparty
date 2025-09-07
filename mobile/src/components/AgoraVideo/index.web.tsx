import React from 'react';
import VideoPlaceholder from '../VideoPlaceholder';

interface AgoraVideoProps {
  isLocal: boolean;
  uid?: number;
  channelId: string;
  style?: any;
  username?: string;
}

// Web-specific implementation that uses VideoPlaceholder instead of Agora components
const AgoraVideo: React.FC<AgoraVideoProps> = ({ isLocal, username, style }) => {
  return (
    <VideoPlaceholder 
      isLocal={isLocal} 
      username={username} 
    />
  );
};

export default AgoraVideo;
