import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft,
  Camera,
  AtSign,
  User as UserIcon,
  MapPin,
  Globe,
  Briefcase,
  Phone
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { updateProfile, checkUsernameAvailability } from '../lib/auth';

// Define the Profile type since the module does not export it
type Profile = {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  industry?: string;
  phone?: string;
  account_type?: 'personal' | 'business';
};

export default function HubProfile() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile?.username === originalUsername) {
      setUsernameAvailable(null);
      return;
    }
    const checkUsername = async () => {
      if (!profile?.username || profile.username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      const { available } = await checkUsernameAvailability(profile.username);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [profile?.username, originalUsername]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Navigate to a login screen if not authenticated
        navigation.navigate('Login' as never);
        return;
      }
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setProfile(prof);
        setOriginalUsername(prof.username);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    if (profile.username !== originalUsername && !usernameAvailable) {
      setError('Username is not available');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const { error: updateError } = await updateProfile({
        display_name: profile.display_name,
        username: profile.username,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        industry: profile.industry,
        phone: profile.phone,
      });
      if (updateError) throw updateError;
      setSuccess('Profile updated successfully');
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    // On React Native you would use an image picker library (e.g. expo-image-picker)
    Alert.alert('Upload', 'Avatar upload is not implemented in this demo');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      <View style={styles.form}>
        {/* Avatar */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=random` }}
              style={styles.avatar}
            />
            <TouchableOpacity onPress={handleAvatarUpload} style={styles.cameraButton}>
              <Camera size={16} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.displayName}>{profile.display_name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <View style={styles.inputWrapper}>
            <UserIcon size={16} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={profile.display_name}
              onChangeText={(text) =>
                setProfile((prev: Profile | null) =>
                  prev ? { ...prev, display_name: text } : prev
                )
              }
              placeholder="Your display name"
              placeholderTextColor="#6B7280"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrapper}>
            <AtSign size={16} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                profile.username === originalUsername
                  ? styles.inputNeutral
                  : usernameAvailable
                  ? styles.inputValid
                  : styles.inputInvalid,
              ]}
              value={profile.username}
              onChangeText={(text) =>
                setProfile((prev: Profile | null) =>
                  prev ? { ...prev, username: text } : prev
                )
              }
              placeholder="Your username"
              placeholderTextColor="#6B7280"
            />
            {profile.username !== originalUsername && profile.username.length >= 3 && (
              <View style={styles.statusIcon}>
                {checkingUsername ? (
                  <ActivityIndicator size="small" color="#9CA3AF" />
                ) : usernameAvailable ? (
                  <Text style={{ color: '#10B981', fontSize: 16 }}>✓</Text>
                ) : (
                  <Text style={{ color: '#EF4444', fontSize: 16 }}>×</Text>
                )}
              </View>
            )}
          </View>
          {profile.username !== originalUsername && !usernameAvailable && profile.username.length >= 3 && (
            <Text style={styles.errorTextSmall}>This username is already taken</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio || ''}
            onChangeText={(text) =>
              setProfile((prev: Profile | null) =>
                prev ? { ...prev, bio: text } : prev
              )
            }
            placeholder="Tell us about yourself..."
            placeholderTextColor="#6B7280"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={16} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={profile.location || ''}
              onChangeText={(text) =>
                setProfile((prev: Profile | null) =>
                  prev ? { ...prev, location: text } : prev
                )
              }
              placeholder="Your location"
              placeholderTextColor="#6B7280"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Website</Text>
          <View style={styles.inputWrapper}>
            <Globe size={16} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={profile.website || ''}
              onChangeText={(text) =>
                setProfile((prev: Profile | null) =>
                  prev ? { ...prev, website: text } : prev
                )
              }
              placeholder="https://example.com"
              placeholderTextColor="#6B7280"
            />
          </View>
        </View>

        {profile.account_type === 'business' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry</Text>
              <View style={styles.inputWrapper}>
                <Briefcase size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={profile.industry || ''}
                  onChangeText={(text) =>
                    setProfile((prev: Profile | null) =>
                      prev ? { ...prev, industry: text } : prev
                    )
                  }
                  placeholder="Your industry"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Phone</Text>
              <View style={styles.inputWrapper}>
                <Phone size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={profile.phone || ''}
                  onChangeText={(text) =>
                    setProfile((prev: Profile | null) =>
                      prev ? { ...prev, phone: text } : prev
                    )
                  }
                  placeholder="Your business phone"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Hub' as never)} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveButton, saving && styles.disabledButton]}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.5)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  errorTextSmall: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.5)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
  },
  form: {
    flex: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#06B6D4',
    padding: 6,
    borderRadius: 9999,
  },
  nameContainer: {
    marginLeft: 16,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 8,
  },
  inputNeutral: {
    borderColor: '#374151',
  },
  inputValid: {
    borderColor: '#10B981',
  },
  inputInvalid: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  statusIcon: {
    marginLeft: 8,
  },
});
