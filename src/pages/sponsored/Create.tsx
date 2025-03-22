import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Upload, DollarSign } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { handleAdPayment } from '../../lib/payments'; // if needed
import { format } from 'date-fns';

interface FormData {
  title: string;
  description: string;
  content_url: string;
  budget: number;
  target_audience: string[];
  start_time: string;
  end_time: string;
}

export default function CreateSponsored(): React.JSX.Element {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    content_url: '',
    budget: 0,
    target_audience: [],
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    checkAccountType();
  }, []);

  const checkAccountType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');
      if (profile.account_type !== 'business') {
        navigation.navigate('SponsoredHub' as never);
        return;
      }
      setIsBusinessAccount(true);
    } catch (err) {
      console.error('Error checking account type:', err);
      navigation.navigate('SponsoredHub' as never);
    }
  };

  // Replace file input with Expo ImagePicker
  const handleContentUpload = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Permission to access gallery is required');
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });
      // Use new ImagePicker API property "canceled" (not "cancelled")
      if (pickerResult.canceled) return;

      // Use assets array from successful picker result
      const uri = pickerResult.assets[0].uri;
      
      setLoading(true);
      // Fetch the selected file's data as blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Validate file type and size if needed.
      const fileExt = uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `sponsored/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(filePath, blob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        content_url: publicUrl,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate form data
      if (!formData.title.trim()) throw new Error('Title is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.content_url) throw new Error('Content is required');
      if (formData.budget <= 0) throw new Error('Budget must be greater than 0');
      if (!formData.start_time || !formData.end_time) throw new Error('Start and end times are required');

      // Create sponsored content in Supabase
      const { data: content, error: contentError } = await supabase
        .from('sponsored_content')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          content_url: formData.content_url,
          budget: formData.budget,
          target_audience: formData.target_audience,
          start_time: formData.start_time,
          end_time: formData.end_time,
          status: 'draft',
        })
        .select()
        .single();

      if (contentError) throw contentError;

      setSuccess('Sponsored content created successfully!');
      navigation.navigate('SponsoredHub' as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sponsored content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('SponsoredHub' as never)} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Create Sponsored Content</Text>
          <Text style={styles.headerSubtitle}>Create a new sponsored content opportunity</Text>
        </View>
      </View>

      {error && (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {success && (
        <View style={styles.messageContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Looking for Creative Content Creators"
              placeholderTextColor="#9CA3AF"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the opportunity and requirements..."
              placeholderTextColor="#9CA3AF"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Content</Text>
            <View style={styles.uploadRow}>
              {formData.content_url ? (
                <View style={styles.previewContainer}>
                  {formData.content_url.includes('.mp4') ? (
                    <Text style={styles.previewText}>Video Preview</Text>
                  ) : (
                    <Image
                      source={{ uri: formData.content_url }}
                      style={styles.previewImage}
                    />
                  )}
                </View>
              ) : null}
              <TouchableOpacity onPress={handleContentUpload} style={styles.uploadButton}>
                <View style={styles.uploadButtonContent}>
                  <Upload size={20} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Upload Content</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Budget and Timing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget and Timing</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Budget (in INR)</Text>
            <View style={styles.inputWithIcon}>
              <DollarSign size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter budget amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={String(formData.budget)}
                onChangeText={text => setFormData(prev => ({ ...prev, budget: parseInt(text) }))}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flexOne]}>
              <Text style={styles.label}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DDThh:mm"
                placeholderTextColor="#9CA3AF"
                value={formData.start_time}
                onChangeText={text => setFormData(prev => ({ ...prev, start_time: text }))}
              />
            </View>
            <View style={[styles.inputGroup, styles.flexOne]}>
              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DDThh:mm"
                placeholderTextColor="#9CA3AF"
                value={formData.end_time}
                onChangeText={text => setFormData(prev => ({ ...prev, end_time: text }))}
              />
            </View>
          </View>
        </View>

        {/* Target Audience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Audience</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Demographics (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 18-24, Students, Tech-savvy"
              placeholderTextColor="#9CA3AF"
              value={formData.target_audience.join(', ')}
              onChangeText={text =>
                setFormData(prev => ({
                  ...prev,
                  target_audience: text.split(',').map(s => s.trim()).filter(Boolean),
                }))
              }
            />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('SponsoredHub' as never)}
          style={[styles.actionButton, styles.cancelButton]}
        >
          <Text style={styles.actionButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.actionButton, styles.submitButton, loading && styles.buttonDisabled]}
        >
          <Text style={styles.actionButtonText}>{loading ? 'Creating...' : 'Create Opportunity'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  formContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexOne: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#06B6D4',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadButton: {
    flex: 1,
  },
  uploadButtonContent: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
  },
});
