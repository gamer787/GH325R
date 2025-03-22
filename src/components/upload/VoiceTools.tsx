import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react-native';

interface VoiceToolsProps {
  voiceOver: {
    url: string;
    duration: number;
  } | null;
  onVoiceAdd: (voice: { url: string; duration: number }) => void;
  onVoiceRemove: () => void;
}

export function VoiceTools({ voiceOver, onVoiceAdd, onVoiceRemove }: VoiceToolsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);

      // Start timer
      let time = 0;
      timerRef.current = setInterval(() => {
        time += 1;
        setRecordingTime(time);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = async () => {
    if (recordingRef.current) {
      setIsRecording(false);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        onVoiceAdd({
          url: uri,
          duration: recordingTime
        });
      }

      clearInterval(timerRef.current!);
      setRecordingTime(0);
    }
  };

  const togglePlayback = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.replayAsync();
      }
      setIsPlaying(!isPlaying);
    } else if (voiceOver) {
      const { sound } = await Audio.Sound.createAsync({ uri: voiceOver.url });
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {!voiceOver ? (
        <View style={styles.center}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={[
              styles.recordButton,
              isRecording ? styles.recording : styles.notRecording
            ]}
          >
            {isRecording ? <Square size={24} color="#fff" /> : <Mic size={24} color="#000" />}
          </TouchableOpacity>

          {isRecording && (
            <Text style={styles.recordingText}>
              Recording... {formatTime(recordingTime)}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.playbackContainer}>
          <TouchableOpacity
            onPress={togglePlayback}
            style={styles.playButton}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </TouchableOpacity>

          <Text style={styles.timeText}>{formatTime(Math.floor(voiceOver.duration))}</Text>

          <TouchableOpacity
            onPress={onVoiceRemove}
            style={styles.removeButton}
          >
            <Trash2 size={20} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111827',
    borderRadius: 12,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingText: {
    color: '#EF4444',
    marginTop: 8,
    fontWeight: '600',
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recording: {
    backgroundColor: '#EF4444',
  },
  notRecording: {
    backgroundColor: '#06B6D4',
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  playButton: {
    backgroundColor: '#06B6D4',
    padding: 8,
    borderRadius: 24,
  },
  timeText: {
    color: '#9CA3AF',
  },
  removeButton: {
    padding: 8,
  },
});

export default VoiceTools;
