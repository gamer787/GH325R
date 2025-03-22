import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2, X } from 'lucide-react-native';

interface DeletePostModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  type: 'vibe' | 'banger';
}

export function DeletePostModal({ onConfirm, onCancel, type }: DeletePostModalProps) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Trash2 size={24} color="#EF4444" />
              <Text style={styles.headerTitle}>
                Delete {type === 'vibe' ? 'Vibe' : 'Banger'}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <Text style={styles.bodyText}>
            Are you sure you want to delete this {type}? This action cannot be undone.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelButton]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.button, styles.deleteButton]}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1F2937', // Gray-900
    width: '100%',
    maxWidth: 480,
    borderRadius: 8,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444', // Red-500
    marginLeft: 8,
  },
  bodyText: {
    color: '#D1D5DB', // Gray-300
    fontSize: 16,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#374151', // Gray-800
  },
  deleteButton: {
    backgroundColor: '#EF4444', // Red-500
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DeletePostModal;
