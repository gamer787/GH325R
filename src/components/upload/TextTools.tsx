import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from 'react-native';
import { Plus } from 'lucide-react-native';

interface TextOverlay {
  id: string;
  text: string;
  position: { x: number; y: number };
  style: {
    fontSize: number;
    color: string;
    fontFamily: string;
  };
}

interface TextToolsProps {
  textOverlays: TextOverlay[];
  onTextAdd: (text: TextOverlay) => void;
  onTextUpdate: (id: string, text: TextOverlay) => void;
  onTextRemove: (id: string) => void;
}

export function TextTools({
  textOverlays,
  onTextAdd,
  onTextRemove
}: TextToolsProps) {
  const [newText, setNewText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(24);

  const handleAddText = () => {
    if (!newText.trim()) return;

    onTextAdd({
      id: Math.random().toString(),
      text: newText,
      position: { x: 50, y: 50 },
      style: {
        fontSize,
        color: selectedColor,
        fontFamily: 'sans-serif'
      }
    });

    setNewText('');
  };

  return (
    <View style={styles.container}>
      {/* Add Text Input */}
      <View style={styles.inputContainer}>
        <TextInput
          value={newText}
          onChangeText={setNewText}
          placeholder="Add text..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
        />
        <TouchableOpacity
          onPress={handleAddText}
          disabled={!newText.trim()}
          style={[styles.addButton, !newText.trim() && styles.disabledButton]}
        >
          <Plus width={20} height={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Font Size Control */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Font Size</Text>
        <TextInput
          style={styles.fontSizeInput}
          keyboardType="numeric"
          value={fontSize.toString()}
          onChangeText={(value) => setFontSize(parseInt(value) || 0)}
        />
      </View>

      {/* Color Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color</Text>
        <View style={styles.colorContainer}>
          {['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() => setSelectedColor(color)}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && styles.selectedColor
              ]}
            />
          ))}
        </View>
      </View>

      {/* Added Text Overlays */}
      {textOverlays.length > 0 && (
        <View style={styles.textOverlayContainer}>
          <Text style={styles.sectionTitle}>Added Text</Text>
          {textOverlays.map((overlay) => (
            <View key={overlay.id} style={styles.textOverlayItem}>
              <Text style={{ color: overlay.style.color }}>
                {overlay.text}
              </Text>
              <TouchableOpacity onPress={() => onTextRemove(overlay.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderColor: '#374151',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#9CA3AF',
    marginBottom: 8,
    fontSize: 14,
  },
  fontSizeInput: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  textOverlayContainer: {
    marginTop: 16,
  },
  textOverlayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeText: {
    color: '#EF4444',
  },
});

export default TextTools;
