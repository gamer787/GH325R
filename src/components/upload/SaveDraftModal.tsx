import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

interface SaveDraftModalProps {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveDraftModal({ visible, onSave, onDiscard }: SaveDraftModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Save as Draft?</Text>
          <Text style={styles.description}>
            You can continue editing this post later from your drafts.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onDiscard}
              style={styles.discardButton}
            >
              <Text style={styles.buttonText}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              style={styles.saveButton}
            >
              <Text style={styles.buttonText}>Save Draft</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    maxWidth: 350,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#06B6D4',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default SaveDraftModal;
