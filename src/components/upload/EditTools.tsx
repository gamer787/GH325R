import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet
} from 'react-native';
import {
  Sliders,
  Sparkles,
  Type,
  Sticker,
  Music2,
  Mic
} from 'lucide-react-native';
// Assume these tools have been ported to React Native
import { AdjustmentTools } from './AdjustmentTools';
import { FilterTools } from './FilterTools';
import { TextTools } from './TextTools';
import { StickerTools } from './StickerTools';
import { MusicTools } from './MusicTools';
import { VoiceTools } from './VoiceTools';

interface EditToolsProps {
  selectedType: 'vibe' | 'banger';
  files: any[]; // In React Native, you may use a different file type
  previews: string[];
  currentIndex: number;
  onNextFile: () => void;
  editStates: any[];
  updateEditState: (updates: any) => void;
}

export function EditTools({
  selectedType,
  files,
  previews,
  currentIndex,
  onNextFile,
  editStates,
  updateEditState
}: EditToolsProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  // crop and zoom states would be used with a cropping library
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const currentEditState = editStates[currentIndex];

  // Placeholder for text drag handling.
  // In React Native you’d implement this using PanResponder or a draggable library.
  const handleTextDrag = (id: string, gestureState: any, containerLayout: { width: number; height: number }) => {
    let x = (gestureState.moveX / containerLayout.width) * 100;
    let y = (gestureState.moveY / containerLayout.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    updateEditState({
      ...currentEditState,
      textOverlays: currentEditState.textOverlays.map((overlay: any) => {
        if (overlay.id === id) {
          return { ...overlay, position: { x, y } };
        }
        return overlay;
      })
    });
  };

  // Web CSS filters aren’t supported in React Native.
  // You could integrate a native solution if needed.
  const getImageStyle = () => {
    return {};
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* File Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Editing {currentIndex + 1} of {files.length}
        </Text>
        {currentIndex < files.length - 1 && (
          <TouchableOpacity onPress={onNextFile}>
            <Text style={styles.nextText}>Next File →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tools Bar */}
      <ScrollView
        horizontal
        contentContainerStyle={styles.toolsBar}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity 
          onPress={() => setActiveTool(activeTool === 'adjust' ? null : 'adjust')}
          style={[styles.toolButton, activeTool === 'adjust' && styles.activeTool]}
        >
          <View style={styles.iconContainer}>
            <Sliders size={20} color="#06B6D4" />
          </View>
          <Text style={styles.toolLabel}>Adjust</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTool(activeTool === 'filters' ? null : 'filters')}
          style={[styles.toolButton, activeTool === 'filters' && styles.activeTool]}
        >
          <View style={styles.iconContainer}>
            <Sparkles size={20} color="#06B6D4" />
          </View>
          <Text style={styles.toolLabel}>Filters</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTool(activeTool === 'text' ? null : 'text')}
          style={[styles.toolButton, activeTool === 'text' && styles.activeTool]}
        >
          <View style={styles.iconContainer}>
            <Type size={20} color="#06B6D4" />
          </View>
          <Text style={styles.toolLabel}>Text</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTool(activeTool === 'stickers' ? null : 'stickers')}
          style={[styles.toolButton, activeTool === 'stickers' && styles.activeTool]}
        >
          <View style={styles.iconContainer}>
            <Sticker size={20} color="#06B6D4" />
          </View>
          <Text style={styles.toolLabel}>Stickers</Text>
        </TouchableOpacity>

        {selectedType === 'banger' && (
          <>
            <TouchableOpacity 
              onPress={() => setActiveTool(activeTool === 'music' ? null : 'music')}
              style={[styles.toolButton, activeTool === 'music' && styles.activeTool]}
            >
              <View style={styles.iconContainer}>
                <Music2 size={20} color="#06B6D4" />
              </View>
              <Text style={styles.toolLabel}>Music</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTool(activeTool === 'voice' ? null : 'voice')}
              style={[styles.toolButton, activeTool === 'voice' && styles.activeTool]}
            >
              <View style={styles.iconContainer}>
                <Mic size={20} color="#06B6D4" />
              </View>
              <Text style={styles.toolLabel}>Voice</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Active Tool Panel */}
      {activeTool === 'adjust' && (
        <AdjustmentTools
          adjustments={currentEditState.adjustments}
          onAdjustmentChange={(adjustments) => updateEditState({ adjustments })}
        />
      )}
      {activeTool === 'filters' && (
        <FilterTools
          selectedFilter={currentEditState.selectedFilter}
          onFilterSelect={(filter) => updateEditState({ selectedFilter: filter })}
        />
      )}
      {activeTool === 'text' && (
        <TextTools
          textOverlays={currentEditState.textOverlays}
          onTextAdd={(text) =>
            updateEditState({
              textOverlays: [...currentEditState.textOverlays, text]
            })
          }
          onTextUpdate={(id, text) =>
            updateEditState({
              textOverlays: currentEditState.textOverlays.map((t: any) =>
                t.id === id ? text : t
              )
            })
          }
          onTextRemove={(id) =>
            updateEditState({
              textOverlays: currentEditState.textOverlays.filter((t: any) => t.id !== id)
            })
          }
        />
      )}
      {activeTool === 'stickers' && (
        <StickerTools
          selectedStickers={currentEditState.selectedStickers}
          onStickerAdd={(sticker) =>
            updateEditState({
              selectedStickers: [...currentEditState.selectedStickers, sticker]
            })
          }
          onStickerRemove={(id) =>
            updateEditState({
              selectedStickers: currentEditState.selectedStickers.filter((s: any) => s.id !== id)
            })
          }
        />
      )}
      {activeTool === 'music' && (
        <MusicTools
          onMusicSelect={(music) => updateEditState({ selectedMusic: music })}
        />
      )}
      {activeTool === 'voice' && (
        <VoiceTools
          onVoiceSelect={(voice) => updateEditState({ selectedVoice: voice })}
        />
      )}

      {/* Preview Area */}
      <View style={styles.previewContainer}>
        {/* For cropping, replace ReactEasyCrop with a native cropping solution.
            Here we simply display the image. */}
        <Image
          source={{ uri: previews[currentIndex] }}
          style={[styles.previewImage, getImageStyle()]}
          resizeMode="cover"
        />

        {/* Text Overlays */}
        {currentEditState.textOverlays.map((overlay: any) => (
          <View
            key={overlay.id}
            style={[
              styles.textOverlay,
              {
                // NOTE: React Native does not support percentage-based positioning in the same way.
                // You may need to calculate pixel positions based on the container dimensions.
                left: `${overlay.position.x}%`,
                top: `${overlay.position.y}%`
              }
            ]}
          >
            <Text
              style={{
                color: overlay.style.color,
                fontSize: overlay.style.fontSize,
                fontFamily: overlay.style.fontFamily
              }}
            >
              {overlay.text}
            </Text>
          </View>
        ))}

        {/* Stickers */}
        {currentEditState.selectedStickers.map((sticker: any) => (
          <View
            key={sticker.id}
            style={[
              styles.stickerOverlay,
              {
                left: `${sticker.position.x}%`,
                top: `${sticker.position.y}%`,
                transform: [
                  { scale: sticker.scale },
                  { rotate: `${sticker.rotation}deg` }
                ]
              }
            ]}
          >
            <Image source={{ uri: sticker.url }} style={styles.stickerImage} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  progressText: {
    color: '#9CA3AF',
    fontSize: 14
  },
  nextText: {
    color: '#06B6D4',
    fontSize: 14
  },
  toolsBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    marginBottom: 16
  },
  toolButton: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 64
  },
  activeTool: {
    // Additional active styling if needed
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6,182,212,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4
  },
  toolLabel: {
    fontSize: 10,
    color: '#9CA3AF'
  },
  previewContainer: {
    position: 'relative',
    aspectRatio: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  textOverlay: {
    position: 'absolute',
    // Center the overlay based on its own dimensions.
    transform: [{ translateX: -50 }, { translateY: -50 }]
  },
  stickerOverlay: {
    position: 'absolute',
    transform: [{ translateX: -50 }, { translateY: -50 }]
  },
  stickerImage: {
    width: 50,
    height: 50
  }
});

export default EditTools;
