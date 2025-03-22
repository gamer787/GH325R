import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Sliders } from 'lucide-react-native';

interface AdjustmentToolsProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentChange: (adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  }) => void;
}

export function AdjustmentTools({ adjustments, onAdjustmentChange }: AdjustmentToolsProps) {
  return (
    <View style={styles.container}>
      {/* Brightness */}
      <View style={styles.control}>
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Brightness</Text>
          <Text style={styles.valueText}>{adjustments.brightness}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={-100}
          maximumValue={100}
          step={1}
          value={adjustments.brightness}
          onValueChange={(value) =>
            onAdjustmentChange({ ...adjustments, brightness: value })
          }
          minimumTrackTintColor="#06B6D4"
          maximumTrackTintColor="#374151"
          thumbTintColor="#06B6D4"
        />
      </View>

      {/* Contrast */}
      <View style={styles.control}>
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Contrast</Text>
          <Text style={styles.valueText}>{adjustments.contrast}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={-100}
          maximumValue={100}
          step={1}
          value={adjustments.contrast}
          onValueChange={(value) =>
            onAdjustmentChange({ ...adjustments, contrast: value })
          }
          minimumTrackTintColor="#06B6D4"
          maximumTrackTintColor="#374151"
          thumbTintColor="#06B6D4"
        />
      </View>

      {/* Saturation */}
      <View style={styles.control}>
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>Saturation</Text>
          <Text style={styles.valueText}>{adjustments.saturation}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={-100}
          maximumValue={100}
          step={1}
          value={adjustments.saturation}
          onValueChange={(value) =>
            onAdjustmentChange({ ...adjustments, saturation: value })
          }
          minimumTrackTintColor="#06B6D4"
          maximumTrackTintColor="#374151"
          thumbTintColor="#06B6D4"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    gap: 16,
  },
  control: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  valueText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  slider: {
    width: '100%',
  },
});

export default AdjustmentTools;
