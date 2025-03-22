import React from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { MapPin, Clock } from 'lucide-react-native';
import { format } from 'date-fns';

interface PostDetailsProps {
  caption: string;
  location: string;
  hideCounts: boolean;
  scheduledTime: Date | null;
  onCaptionChange: (caption: string) => void;
  onLocationChange: (location: string) => void;
  onHideCountsChange: (hide: boolean) => void;
  onScheduleChange: (date: Date | null) => void;
  onHashtagsChange: (hashtags: string[]) => void;
  onMentionsChange: (mentions: string[]) => void;
}

export function PostDetails({
  caption,
  location,
  hideCounts,
  scheduledTime,
  onCaptionChange,
  onLocationChange,
  onHideCountsChange,
  onScheduleChange,
  onHashtagsChange,
  onMentionsChange
}: PostDetailsProps) {
  
  const handleCaptionChange = (text: string) => {
    onCaptionChange(text);
    const words = text.split(/\s+/);
    onHashtagsChange(words.filter(w => w.startsWith('#')).map(w => w.slice(1)));
    onMentionsChange(words.filter(w => w.startsWith('@')).map(w => w.slice(1)));
  };

  return (
    <View style={styles.container}>
      
      {/* Caption */}
      <View style={styles.captionContainer}>
        <TextInput
          placeholder="Write a caption..."
          placeholderTextColor="#9CA3AF"
          value={caption}
          onChangeText={handleCaptionChange}
          multiline={true}
          maxLength={2200}
          style={styles.captionInput}
        />
        <View style={styles.captionInfo}>
          <Text style={styles.infoText}>{caption.length}/2,200</Text>
          <Text style={styles.infoText}>
            {caption.split(/\s+/).filter(w => w.startsWith('#')).length}/30 hashtags
          </Text>
        </View>
      </View>

      {/* Location */}
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#9CA3AF" style={styles.icon} />
        <TextInput
          placeholder="Add location"
          placeholderTextColor="#9CA3AF"
          value={location}
          onChangeText={onLocationChange}
          style={styles.input}
        />
      </View>

      {/* Advanced Options */}
      <View style={styles.advancedContainer}>
        {/* Hide Counts */}
        <View style={styles.optionRow}>
          <Text style={styles.optionText}>Hide like and view counts</Text>
          <Switch
            value={hideCounts}
            onValueChange={onHideCountsChange}
            trackColor={{ false: '#4B5563', true: '#06B6D4' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Schedule Post */}
        <View>
          <TouchableOpacity
            onPress={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              onScheduleChange(tomorrow);
            }}
            style={styles.scheduleButton}
          >
            <Clock size={20} color="#06B6D4" />
            <Text style={styles.scheduleText}>Schedule post</Text>
          </TouchableOpacity>

          {scheduledTime && (
            <Text style={styles.scheduleInfo}>
              Will be posted on {format(scheduledTime, 'MMM d')} at {format(scheduledTime, 'h:mm a')}
            </Text>
          )}
        </View>
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
  captionContainer: {
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  captionInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  captionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 36,
    paddingRight: 12,
    height: 40,
    marginBottom: 16,
  },
  icon: {
    position: 'absolute',
    left: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  advancedContainer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  scheduleText: {
    color: '#06B6D4',
    fontSize: 14,
  },
  scheduleInfo: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 6,
  },
});

export default PostDetails;
