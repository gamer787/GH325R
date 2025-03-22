import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import { X, UserMinus, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the Profile type locally.
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  account_type: 'personal' | 'business';
  // Add other properties as needed.
}

interface Connection {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'personal' | 'business';
  badge?: {
    role: string;
  };
}

interface ConnectionsModalProps {
  type: 'links' | 'brands';
  profile: Profile;
  items: Connection[];
  onClose: () => void;
  onUnfollow: (userId: string) => void;
}

// Define a navigation param list so that 'Profile' route accepts a { username: string } parameter.
type RootStackParamList = {
  Profile: { username: string };
};

export function ConnectionsModal({
  type,
  profile,
  items,
  onClose,
  onUnfollow,
}: ConnectionsModalProps) {
  const [showUnlinkWarning, setShowUnlinkWarning] = useState<string | null>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const isBusiness = profile.account_type === 'business';
  const title = type === 'links' ? (isBusiness ? 'Trusts' : 'Links') : 'Brands';

  const handleUnfollow = (userId: string) => {
    setShowUnlinkWarning(userId);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            {isBusiness && type === 'links' && (
              <Text style={styles.subTitle}>
                Users who trust this business
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Connection List */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {items.length === 0 ? (
            <Text style={styles.noItemsText}>No {title.toLowerCase()} yet</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.itemContainer}>
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('Profile', { username: item.username });
                    onClose();
                  }}
                  style={styles.userInfo}
                >
                  <Image
                    source={{
                      uri:
                        item.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.display_name
                        )}&background=random`,
                    }}
                    style={styles.avatar}
                  />
                  <View>
                    <Text style={styles.userName}>{item.display_name}</Text>
                    <Text style={styles.userHandle}>@{item.username}</Text>
                    {item.badge && (
                      <Text style={styles.badge}>{item.badge.role}</Text>
                    )}
                    {item.account_type === 'business' && (
                      <Text style={styles.badge}>Business</Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleUnfollow(item.id)}
                  style={styles.unfollowBtn}
                >
                  <UserMinus size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Unlink Warning Modal */}
        {showUnlinkWarning && (
          <Modal transparent animationType="fade" visible>
            <View style={styles.warningOverlay}>
              <View style={styles.warningContainer}>
                <View style={styles.warningHeader}>
                  <AlertTriangle size={24} color="#FACC15" />
                  <Text style={styles.warningTitle}>Unlink Warning</Text>
                </View>

                <Text style={styles.warningText}>
                  You will need to meet this person again in real life to re-establish a connection. Are you sure you want to unlink?
                </Text>

                <View style={styles.warningActions}>
                  <TouchableOpacity
                    onPress={() => setShowUnlinkWarning(null)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.btnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      onUnfollow(showUnlinkWarning);
                      setShowUnlinkWarning(null);
                    }}
                    style={styles.unlinkBtn}
                  >
                    <Text style={styles.btnText}>Unlink</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#111827',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subTitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  scrollContainer: {
    padding: 16,
  },
  noItemsText: {
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 16,
  },
  itemContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  userHandle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    color: '#06B6D4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    fontSize: 12,
  },
  unfollowBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 24,
  },
  warningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    maxWidth: 350,
    width: '90%',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  warningTitle: {
    color: '#FACC15',
    fontWeight: '700',
  },
  warningText: {
    color: '#9CA3AF',
    marginBottom: 16,
  },
  warningActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#374151',
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  unlinkBtn: {
    backgroundColor: '#EF4444',
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  btnText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ConnectionsModal;
