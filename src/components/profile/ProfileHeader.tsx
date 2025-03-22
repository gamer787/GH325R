import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { supabase } from '../../lib/supabase';

// Define Profile type locally.
export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  // Optionally include editing state:
  isEditing?: boolean;
}

interface ProfileHeaderProps {
  profile: Profile;
  isCurrentUser: boolean;
  isEditing: boolean;
  onProfileChange: (updates: Partial<Profile>) => void;
  onSave: () => void;
  onCancel: () => void;
  setError: (error: string | null) => void;
}

// Define navigation parameter list so that the "Profile" route accepts a { username: string } parameter.
type RootStackParamList = {
  Profile: { username: string };
};

export function ProfileHeader({
  profile,
  isCurrentUser,
  isEditing,
  onProfileChange,
  onSave,
  onCancel,
  setError,
}: ProfileHeaderProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();

        // Delete old avatar if it exists
        if (profile.avatar_url) {
          try {
            const oldPath = profile.avatar_url.split('/').pop();
            if (oldPath) {
              await supabase.storage.from('avatars').remove([oldPath]);
            }
          } catch (err) {
            console.error('Error removing old avatar:', err);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.id);

        if (updateError) throw updateError;

        onProfileChange({ avatar_url: publicUrl });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload avatar');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.banner} />

      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri: profile.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile.display_name
                )}&background=random`,
            }}
            style={styles.avatar}
          />

          {/* Avatar Upload Option */}
          {isEditing && (
            <TouchableOpacity
              onPress={handleImageUpload}
              style={styles.uploadOverlay}
            >
              <Camera size={32} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {isEditing ? (
          isCurrentUser && (
            <>
              <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
            </>
          )
        ) : (
          isCurrentUser && (
            <TouchableOpacity
              onPress={() => onProfileChange({ isEditing: true })}
              style={styles.editBtn}
            >
              <Text style={styles.btnText}>Edit Profile</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  banner: {
    height: 128,
    backgroundColor: '#9333EA',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -64,
    left: 16,
  },
  avatarWrapper: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#111827',
    overflow: 'hidden',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: -64,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  cancelBtn: {
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  saveBtn: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ProfileHeader;
