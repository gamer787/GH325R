import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ImageIcon, Film } from 'lucide-react-native';

interface TypeSelectorProps {
  selectedType: 'vibe' | 'banger' | null;
  onTypeSelect: (type: 'vibe' | 'banger') => void;
}

export function TypeSelector({ selectedType, onTypeSelect }: TypeSelectorProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onTypeSelect('vibe')}
        style={[
          styles.typeButton,
          selectedType === 'vibe' ? styles.selected : styles.unselected
        ]}
      >
        <ImageIcon width={32} height={32} />
        <Text style={styles.title}>Vibe</Text>
        <Text style={styles.subtitle}>Share photos & carousels</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onTypeSelect('banger')}
        style={[
          styles.typeButton,
          selectedType === 'banger' ? styles.selected : styles.unselected
        ]}
      >
        <Film width={32} height={32} />
        <Text style={styles.title}>Banger</Text>
        <Text style={styles.subtitle}>Create vertical videos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827', // Dark background for unselected
  },
  selected: {
    backgroundColor: '#06B6D4', // Cyan color for selected
  },
  unselected: {
    backgroundColor: '#1F2937', // Darker gray background for unselected
  },
  title: {
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default TypeSelector;
