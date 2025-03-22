import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import type { Content } from '../../types/ads';

interface ContentSelectorProps {
  content: Content[];
  selectedContent: Content | null;
  onSelectContent: (content: Content) => void;
}

export function ContentSelector({ content, selectedContent, onSelectContent }: ContentSelectorProps) {
  return (
    <View>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.line} />
        <Text style={styles.headerText}>Select Content to Promote</Text>
        <View style={styles.line} />
      </View>

      {/* Content Grid */}
      <View style={styles.grid}>
        {content.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelectContent(item)}
            style={[
              styles.contentCard,
              selectedContent?.id === item.id && styles.selected,
            ]}
          >
            {item.type === 'vibe' ? (
              <Image
                source={{ uri: item.content_url }}
                style={styles.media}
                resizeMode="cover"
              />
            ) : (
              <Video
                source={{ uri: item.content_url }}
                style={styles.media}
                useNativeControls
                resizeMode={ResizeMode.COVER}
              />
            )}

            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.overlay}
            >
              <Text style={styles.caption} numberOfLines={1}>
                {item.caption}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 207, 255, 0.5)',
  },
  headerText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#06B6D4',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contentCard: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#06B6D4',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 6,
    opacity: 0,
  },
  contentCardFocused: {
    opacity: 1,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
