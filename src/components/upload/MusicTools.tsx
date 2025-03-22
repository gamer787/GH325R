import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import { Music2, Search, Play, Pause } from 'lucide-react-native';

interface MusicToolsProps {
  selectedMusic: {
    url: string;
    title: string;
    artist: string;
    startTime: number;
    duration: number;
  } | null;
  onMusicSelect: (music: {
    url: string;
    title: string;
    artist: string;
    startTime: number;
    duration: number;
  } | null) => void;
}

// Example music library
const MUSIC_LIBRARY = [
  {
    id: '1',
    title: 'Summer Vibes',
    artist: 'Chill Beats',
    duration: 180,
    url: 'https://example.com/music1.mp3'
  },
  {
    id: '2',
    title: 'Urban Flow',
    artist: 'City Sounds',
    duration: 210,
    url: 'https://example.com/music2.mp3'
  },
];

export function MusicTools({ selectedMusic, onMusicSelect }: MusicToolsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const [sound, setSound] = useState<Sound | null>(null);

  const filteredMusic = MUSIC_LIBRARY.filter(
    track =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playMusic = (track: typeof MUSIC_LIBRARY[0]) => {
    if (sound) {
      sound.stop(() => sound.release());
      setSound(null);
      setIsPlaying(false);
    }

    const newSound = new Sound(track.url, null, (error) => {
      if (error) {
        console.log('Failed to load sound', error);
        return;
      }
      newSound.play(() => {
        newSound.release();
        setIsPlaying(false);
      });
      setSound(newSound);
      setIsPlaying(true);
    });

    onMusicSelect({
      ...track,
      startTime: 0
    });
  };

  const togglePlayPause = () => {
    if (sound) {
      if (isPlaying) {
        sound.pause();
        setIsPlaying(false);
      } else {
        sound.play(() => {
          setIsPlaying(false);
          sound.release();
        });
        setIsPlaying(true);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Search music..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Music List */}
      <View style={styles.musicList}>
        {filteredMusic.map((track) => (
          <View
            key={track.id}
            style={[
              styles.musicItem,
              selectedMusic?.url === track.url && styles.selectedMusic
            ]}
          >
            <View style={styles.musicDetails}>
              <Text style={styles.musicTitle}>{track.title}</Text>
              <Text style={styles.musicArtist}>{track.artist}</Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                selectedMusic?.url === track.url
                  ? togglePlayPause()
                  : playMusic(track)
              }
              style={styles.playButton}
            >
              {selectedMusic?.url === track.url && isPlaying ? (
                <Pause size={20} color="#9CA3AF" />
              ) : (
                <Play size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>

            {/* Progress Control */}
            {selectedMusic?.url === track.url && (
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={track.duration}
                  step={1}
                  value={startTime}
                  onValueChange={(value) => {
                    setStartTime(value);
                    if (sound) {
                      sound.setCurrentTime(value);
                    }
                  }}
                  minimumTrackTintColor="#06B6D4"
                  maximumTrackTintColor="#374151"
                  thumbTintColor="#06B6D4"
                />
                <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(startTime)}</Text>
                  <Text style={styles.timeText}>{formatTime(track.duration)}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  searchContainer: {
    position: 'relative',
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingLeft: 40,
    height: 40,
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 10,
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  musicList: {
    marginTop: 16,
    gap: 12,
  },
  musicItem: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedMusic: {
    backgroundColor: '#06B6D4',
  },
  musicDetails: {
    flex: 1,
  },
  musicTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  musicArtist: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  playButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#111827',
  },
  sliderContainer: {
    marginTop: 10,
  },
  slider: {
    width: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default MusicTools;
