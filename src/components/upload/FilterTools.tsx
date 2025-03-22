import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface FilterToolsProps {
  selectedFilter: string;
  onFilterSelect: (filter: string) => void;
}

const FILTERS = [
  { id: 'none', name: 'Normal' },
  { id: 'grayscale', name: 'B&W' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'fade', name: 'Fade' },
  { id: 'vivid', name: 'Vivid' },
  { id: 'cool', name: 'Cool' },
  { id: 'warm', name: 'Warm' },
  { id: 'dramatic', name: 'Dramatic' },
  { id: 'matte', name: 'Matte' },
];

export function FilterTools({ selectedFilter, onFilterSelect }: FilterToolsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {FILTERS.map((filter) => {
          const isActive = selectedFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              onPress={() => onFilterSelect(filter.id)}
              style={styles.button}
            >
              <View style={styles.iconContainer}>
                <Sparkles size={24} color={isActive ? '#06B6D4' : '#9CA3AF'} />
              </View>
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    alignItems: 'center',
    marginBottom: 16,
    width: '18%', // Roughly 5 items per row
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#1F2937', // Gray-800
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
  },
  labelActive: {
    color: '#06B6D4', // Cyan-400
  },
  labelInactive: {
    color: '#9CA3AF', // Gray-400
  },
});
