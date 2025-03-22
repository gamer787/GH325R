import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Search } from 'lucide-react-native';

interface Sticker {
  id: string;
  url: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
}

interface StickerToolsProps {
  selectedStickers: Sticker[];
  onStickerAdd: (sticker: Sticker) => void;
  onStickerRemove: (id: string) => void;
}

const STICKERS = {
  Emojis: ['😊', '😂', '🥰', '😎', '🤔', '🔥', '💯', '✨'],
  Shapes: ['❤️', '⭐', '🌟', '💫', '💥', '💭', '💬', '🔷'],
  Animals: ['🐶', '🐱', '🦊', '🦁', '🐼', '🐨', '🐯', '🦄'],
  Food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍫'],
};

export function StickerTools({ selectedStickers, onStickerAdd, onStickerRemove }: StickerToolsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Emojis');

  const handleStickerSelect = (emoji: string) => {
    onStickerAdd({
      id: Math.random().toString(),
      url: emoji,
      position: { x: 50, y: 50 },
      scale: 1,
      rotation: 0
    });
  };

  const filteredStickers = STICKERS[selectedCategory as keyof typeof STICKERS].filter(
    sticker => searchQuery ? sticker.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search width={20} height={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="Search stickers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
      >
        {Object.keys(STICKERS).map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.tab,
              selectedCategory === category && styles.activeTab
            ]}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === category && styles.activeTabText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sticker Grid */}
      <FlatList
        data={filteredStickers}
        keyExtractor={(item) => item}
        numColumns={4}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleStickerSelect(item)}
            style={styles.stickerButton}
          >
            <Text style={styles.stickerText}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Added Stickers */}
      {selectedStickers.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Added Stickers</Text>
          <View style={styles.selectedStickerContainer}>
            {selectedStickers.map((sticker) => (
              <View key={sticker.id} style={styles.selectedSticker}>
                <Text style={styles.stickerText}>{sticker.url}</Text>
                <TouchableOpacity onPress={() => onStickerRemove(sticker.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    top: '50%',
    left: 12,
    transform: [{ translateY: -10 }],
  },
  input: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 36,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#06B6D4',
  },
  tabText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1F2937',
  },
  stickerButton: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    margin: 4,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerText: {
    fontSize: 24,
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 6,
  },
  selectedStickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedSticker: {
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeText: {
    color: '#EF4444',
    fontSize: 12,
  },
});

export default StickerTools;
