import React from 'react';
import { View } from 'react-native';
import { RtcLocalView, RtcRemoteView } from 'react-native-agora';

interface AgoraVideoProps {
  isLocal: boolean;
  uid?: number;
  channelId: string;
  style?: any;
}

const AgoraVideo: React.FC<AgoraVideoProps> = ({ isLocal, uid, channelId, style }) => {
  if (isLocal) {
    return (
      <RtcLocalView.SurfaceView
        style={style || { flex: 1 }}
        channelId={channelId}
        renderMode={1} // VideoRenderMode.Hidden
      />
    );
  } else if (uid) {
    return (
      <RtcRemoteView.SurfaceView
        style={style || { flex: 1 }}
        uid={uid}
        channelId={channelId}
        renderMode={1} // VideoRenderMode.Hidden
        zOrderMediaOverlay={true}
      />
    );
  }
  
  return <View style={style || { flex: 1, backgroundColor: '#333' }} />;
};

export default AgoraVideo;
