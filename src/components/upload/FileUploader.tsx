import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ScrollView 
} from 'react-native';
import { ImageIcon, Film, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

interface FileUploaderProps {
  selectedType: 'vibe' | 'banger';
  files: any[]; // Using "any" because Expo ImagePicker returns objects with a uri
  previews: string[];
  onFilesSelected: (files: any[]) => void;
  onFileRemove: (index: number) => void;
  onFilesReorder: (from: number, to: number) => void;
}

export function FileUploader({
  selectedType,
  files,
  previews,
  onFilesSelected,
  onFileRemove,
  onFilesReorder
}: FileUploaderProps) {
  // Use Expo ImagePicker to simulate file selection.
  const pickFile = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }

    let pickerResult;
    if (selectedType === 'vibe') {
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
    } else {
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
      });
    }

    if (!pickerResult.cancelled) {
      let selectedFiles = [pickerResult];
      // For vibes, limit to 10 files
      if (selectedType === 'vibe') {
        const totalFiles = files.length + selectedFiles.length;
        if (totalFiles > 10) {
          selectedFiles = selectedFiles.slice(0, 10 - files.length);
          alert(
            'Maximum 10 photos allowed. Only first ' +
              (10 - files.length) +
              ' photos were added.'
          );
        }
      } else {
        // For bangers, allow only one video
        selectedFiles = [selectedFiles[0]];
      }
      // (Additional validation for file type/size would require native code.)
      onFilesSelected(selectedFiles);
    }
  };

  return (
    <View style={styles.container}>
      {files.length > 0 ? (
        <View style={styles.filesContainer}>
          <View
            style={selectedType === 'vibe' ? styles.grid3 : styles.grid1}
          >
            {previews.map((preview, index) => (
              <View
                key={index}
                style={[
                  styles.previewWrapper,
                  selectedType === 'vibe'
                    ? styles.aspectSquare
                    : styles.aspectVideo,
                ]}
              >
                {selectedType === 'vibe' ? (
                  <Image
                    source={{ uri: preview }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Video
                    source={{ uri: preview }}
                    style={styles.previewImage}
                    useNativeControls
                    resizeMode="contain"
                  />
                )}
                <TouchableOpacity
                  onPress={() => onFileRemove(index)}
                  style={styles.removeButton}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {selectedType === 'vibe' && files.length < 10 && (
            <TouchableOpacity onPress={pickFile} style={styles.addMoreButton}>
              <ImageIcon size={20} color="#9CA3AF" />
              <Text style={styles.addMoreText}>
                Add More ({10 - files.length} remaining)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <TouchableOpacity onPress={pickFile} style={styles.emptyContent}>
            <View style={styles.placeholderIcon}>
              {selectedType === 'vibe' ? (
                <ImageIcon size={64} color="#06B6D4" />
              ) : (
                <Film size={64} color="#06B6D4" />
              )}
            </View>
            <Text style={styles.emptyTitle}>
              {selectedType === 'vibe' ? 'Upload Photos' : 'Upload Video'}
            </Text>
            <Text style={styles.emptyDescription}>
              {selectedType === 'vibe'
                ? 'Share up to 10 photos in one post'
                : 'Create a video up to 90 seconds'}
            </Text>
            <TouchableOpacity onPress={pickFile} style={styles.selectButton}>
              <Text style={styles.selectButtonText}>
                Select Files
              </Text>
            </TouchableOpacity>
            <Text style={styles.dragText}>
              Or drag and drop files here
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Overall container style
  },
  filesContainer: {
    // Container when files exist
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  grid1: {
    // For video, a single column layout
  },
  previewWrapper: {
    position: 'relative',
    marginBottom: 8,
    marginRight: 8,
  },
  aspectSquare: {
    width: '30%',
    aspectRatio: 1,
  },
  aspectVideo: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#000',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 4,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#374151',
    borderRadius: 8,
    marginTop: 8,
  },
  addMoreText: {
    color: '#9CA3AF',
    marginLeft: 8,
  },
  emptyContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#374151',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  selectButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  selectButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  dragText: {
    marginTop: 16,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default FileUploader;
