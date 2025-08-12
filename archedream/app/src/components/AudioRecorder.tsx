import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { colors } from '../theme/tokens';

export default function AudioRecorder({ onFinish }:{ onFinish:(uri:string)=>void }){
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [status, setStatus] = useState<string>('');

  const start = async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    setRecording(recording);
    setStatus('recording');
  };

  const stop = async () => {
    if(!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null); setStatus('');
    if(uri) onFinish(uri);
  };

  return (
    <View style={{marginVertical:12}}>
      {status!=='recording' ? (
        <TouchableOpacity onPress={start} style={{backgroundColor:colors.iris,padding:10,borderRadius:12,alignSelf:'flex-start'}}>
          <Text style={{color:'#fff'}}>Записать аудио</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={stop} style={{backgroundColor:'#D94A4A',padding:10,borderRadius:12,alignSelf:'flex-start'}}>
          <Text style={{color:'#fff'}}>Стоп</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}