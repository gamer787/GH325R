import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { MapPin, Globe } from 'lucide-react-native';

// Define the Profile type locally.
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  location?: string;
  website?: string;
  bio?: string;
}

interface PersonalProfileProps {
  profile: Profile;
  isEditing: boolean;
  onProfileChange: (updatedData: Partial<Profile>) => void;
}

export function PersonalProfile({
  profile,
  isEditing,
  onProfileChange,
}: PersonalProfileProps) {
  const handleOpenWebsite = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl).catch(() => {
      console.warn('Could not open URL:', fullUrl);
    });
  };

  return (
    <View style={styles.container}>
      {isEditing ? (
        <>
          {/* Location Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <View style={styles.inputWrapper}>
              <MapPin size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                value={profile.location || ''}
                onChangeText={(value) => onProfileChange({ location: value })}
                placeholder="Your location"
                placeholderTextColor="#6B7280"
                style={styles.input}
              />
            </View>
          </View>

          {/* Website Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <View style={styles.inputWrapper}>
              <Globe size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                value={profile.website || ''}
                onChangeText={(value) => onProfileChange({ website: value })}
                placeholder="https://example.com"
                placeholderTextColor="#6B7280"
                keyboardType="url"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          {/* Bio Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              value={profile.bio || ''}
              onChangeText={(value) => onProfileChange({ bio: value })}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
          </View>
        </>
      ) : (
        <>
          {/* Bio Display */}
          {profile.bio && (
            <Text style={styles.bioText}>{profile.bio}</Text>
          )}

          {/* Location Display */}
          {profile.location && (
            <View style={styles.infoRow}>
              <MapPin size={20} color="#06B6D4" />
              <Text style={styles.infoText}>{profile.location}</Text>
            </View>
          )}

          {/* Website Display */}
          {profile.website && (
            <View style={styles.infoRow}>
              <Globe size={20} color="#06B6D4" />
              <TouchableOpacity onPress={() => handleOpenWebsite(profile.website!)}>
                <Text style={styles.linkText}>{profile.website}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 40,
    paddingVertical: 10,
  },
  icon: {
    position: 'absolute',
    left: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: '#111827',
    borderColor: '#374151',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    color: '#FFFFFF',
  },
  bioText: {
    color: '#D1D5DB',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#D1D5DB',
  },
  linkText: {
    color: '#06B6D4',
    textDecorationLine: 'underline',
  },
});

export default PersonalProfile;
