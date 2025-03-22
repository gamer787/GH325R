import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

// Define the Profile type locally.
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  industry?: string;
  phone?: string;
  location?: string;
  website?: string;
  bio?: string;
}

interface BusinessProfileProps {
  profile: Profile;
  isEditing: boolean;
  onProfileChange: (updates: Partial<Profile>) => void;
}

export function BusinessProfile({ profile, isEditing, onProfileChange }: BusinessProfileProps) {
  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return url;
    }
  };

  return (
    <View style={styles.container}>
      {isEditing ? (
        <>
          {/* Industry Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Industry</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="business" size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Technology, Retail, Services"
                placeholderTextColor="#6B7280"
                value={profile.industry || ''}
                onChangeText={(text) => onProfileChange({ industry: text })}
              />
            </View>
          </View>

          {/* Business Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Business Phone</Text>
            <View style={styles.inputWrapper}>
              <Feather name="phone" size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Business phone number"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                value={profile.phone || ''}
                onChangeText={(text) => onProfileChange({ phone: text })}
              />
            </View>
          </View>

          {/* Business Location */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Business Location</Text>
            <View style={styles.inputWrapper}>
              <Feather name="map-pin" size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Business location"
                placeholderTextColor="#6B7280"
                value={profile.location || ''}
                onChangeText={(text) => onProfileChange({ location: text })}
              />
            </View>
          </View>

          {/* Business Website */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Business Website</Text>
            <View style={styles.inputWrapper}>
              <Feather name="globe" size={20} color="#9CA3AF" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                placeholderTextColor="#6B7280"
                value={profile.website || ''}
                onChangeText={(text) => onProfileChange({ website: text })}
              />
            </View>
          </View>

          {/* Business Description */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Business Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about your business..."
              placeholderTextColor="#6B7280"
              value={profile.bio || ''}
              onChangeText={(text) => onProfileChange({ bio: text })}
              multiline
            />
          </View>
        </>
      ) : (
        <>
          {profile.bio ? (
            <Text style={[styles.text, { marginBottom: 16 }]}>{profile.bio}</Text>
          ) : null}
          {profile.industry ? (
            <View style={styles.row}>
              <MaterialIcons name="business" size={20} color="#22d3ee" style={styles.iconDisplay} />
              <Text style={styles.text}>{profile.industry}</Text>
            </View>
          ) : null}
          {profile.phone ? (
            <View style={styles.row}>
              <Feather name="phone" size={20} color="#22d3ee" style={styles.iconDisplay} />
              <Text style={styles.text}>{profile.phone}</Text>
            </View>
          ) : null}
          {profile.location ? (
            <View style={styles.row}>
              <Feather name="map-pin" size={20} color="#22d3ee" style={styles.iconDisplay} />
              <Text style={styles.text}>{profile.location}</Text>
            </View>
          ) : null}
          {profile.website ? (
            <View style={styles.row}>
              <Feather name="globe" size={20} color="#22d3ee" style={styles.iconDisplay} />
              <TouchableOpacity onPress={() => handleLinkPress(profile.website!)}>

                <Text style={[styles.link, { textDecorationLine: 'underline' }]}>{getHostname(profile.website)}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  input: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 8,
    color: 'white',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 8,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconDisplay: {
    marginRight: 8,
  },
  text: {
    color: '#E5E7EB',
    fontSize: 16,
  },
  link: {
    color: '#22d3ee',
    fontSize: 16,
  },
});

export default BusinessProfile;
