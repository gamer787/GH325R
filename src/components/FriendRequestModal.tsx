import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';

interface FriendRequestModalProps {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  onAccept: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function FriendRequestModal({
  username,
  displayName,
  avatarUrl,
  onAccept,
  onReject,
  onClose,
}: FriendRequestModalProps) {
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Friend Request</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.profileInfo}>
              <Image
                source={{
                  uri:
                    avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      displayName
                    )}&background=random`,
                }}
                style={styles.avatar}
              />
              <View style={styles.profileText}>
                <Text style={styles.displayName}>{displayName}</Text>
                <Text style={styles.username}>@{username}</Text>
              </View>
            </View>
            <Text style={styles.prompt}>
              Would you like to connect with {displayName}?
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={onReject} style={[styles.button, styles.declineButton]}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onAccept} style={[styles.button, styles.acceptButton]}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
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
    borderRadius: 8,
    width: '100%',
    maxWidth: 480,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#374151', // Gray-800
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profileText: {
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  prompt: {
    textAlign: 'center',
    fontSize: 16,
    color: '#D1D5DB',
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
  declineButton: {
    backgroundColor: '#374151', // Gray-800
  },
  acceptButton: {
    backgroundColor: '#06B6D4', // Cyan-400
  },
  declineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FriendRequestModal;
