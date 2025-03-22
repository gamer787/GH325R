import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { ChevronLeft, Plus, Minus, Upload, Eye } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface JobFormData {
  title: string;
  companyName: string;
  companyLogo: string;
  location: string;
  type: string;
  salaryRange: string;
  description: string;
  requirements: string[];
  benefits: string[];
  expiresAt: string;
}

export default function CreateJob(): React.JSX.Element {
  // Use any here to bypass strict navigation typing for now.
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { id } = route.params as { id?: string };
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    companyName: '',
    companyLogo: '',
    location: '',
    type: 'full-time',
    salaryRange: '',
    description: '',
    requirements: [''],
    benefits: [''],
    expiresAt: '',
  });

  useEffect(() => {
    checkAccountType();
    if (id) {
      loadJobDraft(id);
      loadJobApplications(id);
    }
  }, [id]);

  const checkAccountType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Home');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();
      if (profile?.account_type !== 'business') {
        navigation.navigate('JobsHub');
        return;
      }
      setIsBusinessAccount(true);
    } catch (error) {
      console.error('Error checking account type:', error);
      navigation.navigate('JobsHub');
    }
  };

  const loadJobApplications = async (jobId: string) => {
    try {
      const { data: apps, error } = await supabase.rpc('get_job_applications', {
        job_id: jobId,
      });
      if (error) throw error;
      setApplications(apps || []);
    } catch (err) {
      console.error('Error loading applications:', err);
    }
  };

  const loadJobDraft = async (draftId: string) => {
    try {
      const { data: draft, error } = await supabase.rpc('get_job_draft', {
        draft_id: draftId,
      });
      if (error) throw error;
      if (draft?.[0]) {
        setFormData({
          title: draft[0].title,
          companyName: draft[0].company_name,
          companyLogo: draft[0].company_logo || '',
          location: draft[0].location,
          type: draft[0].type,
          salaryRange: draft[0].salary_range || '',
          description: draft[0].description,
          requirements: draft[0].requirements?.length ? draft[0].requirements : [''],
          benefits: draft[0].benefits?.length ? draft[0].benefits : [''],
          expiresAt: draft[0].expires_at
            ? format(new Date(draft[0].expires_at), 'yyyy-MM-dd')
            : '',
        });
      }
    } catch (err) {
      console.error('Error loading job draft:', err);
    }
  };

  const handleInputChange = (name: keyof JobFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayInput = (type: 'requirements' | 'benefits', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[type]];
      newArray[index] = value;
      return { ...prev, [type]: newArray };
    });
  };

  const addArrayItem = (type: 'requirements' | 'benefits') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ''],
    }));
  };

  const removeArrayItem = (type: 'requirements' | 'benefits', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const handleLogoUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        throw new Error('Permission to access gallery is required');
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      // New API: check for 'canceled' and then use assets array
      if (pickerResult.canceled) return;
      const imageResult = pickerResult as ImagePicker.ImagePickerSuccessResult;
      const uri = imageResult.assets[0].uri;

      setLoading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, blob);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('logos').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      setFormData(prev => ({ ...prev, companyLogo: publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'open') => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const requirements = formData.requirements.filter(r => r.trim());
      const benefits = formData.benefits.filter(b => b.trim());

      const { error } = await supabase.from('job_listings').insert({
        user_id: user.id,
        title: formData.title,
        company_name: formData.companyName,
        company_logo: formData.companyLogo,
        location: formData.location,
        type: formData.type,
        salary_range: formData.salaryRange,
        description: formData.description,
        requirements,
        benefits,
        status,
        expires_at: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
      });
      if (error) throw error;
      navigation.navigate('JobsHub');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Hub')} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Create Job Listing</Text>
          <Text style={styles.headerSubtitle}>Post a new job opportunity</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('JobsHub')} style={styles.viewJobsButton}>
          <Eye size={20} color="#FFFFFF" />
          <Text style={styles.viewJobsText}>View My Jobs</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Applications Section (if draft id exists) */}
        {id && (
          <View style={styles.applicationsSection}>
            <View style={styles.applicationsHeader}>
              <View>
                <Text style={styles.sectionTitle}>Received Applications</Text>
                <Text style={styles.sectionSubtitle}>
                  {applications.length} {applications.length === 1 ? 'application' : 'applications'} received
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate('JobApplications', { id })}
                style={styles.applicationsButton}
              >
                <Eye size={20} color="#111827" />
                <Text style={styles.applicationsButtonText}>View All Applications</Text>
              </TouchableOpacity>
            </View>
            {applications.length > 0 ? (
              <View style={styles.applicationsList}>
                {applications.slice(0, 3).map((application) => (
                  <View key={application.id} style={styles.applicationItem}>
                    <View style={styles.applicationInfo}>
                      <Image
                        source={{
                          uri:
                            application.applicant_avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              application.applicant_name
                            )}&background=random`,
                        }}
                        style={styles.applicantAvatar}
                      />
                      <View style={styles.applicantDetails}>
                        <Text style={styles.applicantName}>{application.applicant_name}</Text>
                        <Text style={styles.applicantUsername}>@{application.applicant_username}</Text>
                        {application.applicant_badge && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{application.applicant_badge.role}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.applicationStatus}>
                      <Text
                        style={[
                          styles.statusBadge,
                          application.status === 'unviewed'
                            ? styles.statusUnviewed
                            : application.status === 'pending'
                            ? styles.statusPending
                            : application.status === 'accepted'
                            ? styles.statusAccepted
                            : styles.statusRejected,
                        ]}
                      >
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate('JobApplications', { id })}>
                        <Text style={styles.detailsLink}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {applications.length > 3 && (
                  <View style={styles.moreApplications}>
                    <TouchableOpacity onPress={() => navigation.navigate('JobApplications', { id })}>
                      <Text style={styles.moreApplicationsText}>
                        View {applications.length - 3} more applications
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noApplications}>
                <Text style={styles.noApplicationsText}>No applications received yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Senior Software Engineer"
              placeholderTextColor="#9CA3AF"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Acme Inc."
              placeholderTextColor="#9CA3AF"
              value={formData.companyName}
              onChangeText={(text) => handleInputChange('companyName', text)}
            />
          </View>
          <View style={styles.logoSection}>
            <Text style={styles.label}>Company Logo</Text>
            <View style={styles.logoRow}>
              {formData.companyLogo ? (
                <Image source={{ uri: formData.companyLogo }} style={styles.logoImage} />
              ) : null}
              <TouchableOpacity onPress={handleLogoUpload} style={styles.uploadButton}>
                <View style={styles.uploadButtonContent}>
                  <Upload size={20} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Upload Logo</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., New York, NY (or Remote)"
              placeholderTextColor="#9CA3AF"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flexOne]}>
              <Text style={styles.label}>Job Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(itemValue: string) => handleInputChange('type', itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#FFFFFF"
                >
                  <Picker.Item label="Full-time" value="full-time" />
                  <Picker.Item label="Part-time" value="part-time" />
                  <Picker.Item label="Contract" value="contract" />
                  <Picker.Item label="Internship" value="internship" />
                  <Picker.Item label="Freelance" value="freelance" />
                </Picker>
              </View>
            </View>
            <View style={[styles.inputGroup, styles.flexOne]}>
              <Text style={styles.label}>Salary Range</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., $80,000 - $120,000"
                placeholderTextColor="#9CA3AF"
                value={formData.salaryRange}
                onChangeText={(text) => handleInputChange('salaryRange', text)}
              />
            </View>
          </View>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the role, responsibilities, and ideal candidate..."
              placeholderTextColor="#9CA3AF"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline
              numberOfLines={6}
            />
          </View>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <TouchableOpacity onPress={() => addArrayItem('requirements')}>
              <Plus size={20} color="#06B6D4" />
            </TouchableOpacity>
          </View>
          {formData.requirements.map((req, index) => (
            <View key={index} style={styles.arrayRow}>
              <TextInput
                style={[styles.input, styles.flexOne]}
                placeholder="Add a requirement..."
                placeholderTextColor="#9CA3AF"
                value={req}
                onChangeText={(text) => handleArrayInput('requirements', index, text)}
              />
              <TouchableOpacity onPress={() => removeArrayItem('requirements', index)} style={styles.iconButton}>
                <Minus size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <TouchableOpacity onPress={() => addArrayItem('benefits')}>
              <Plus size={20} color="#06B6D4" />
            </TouchableOpacity>
          </View>
          {formData.benefits.map((benefit, index) => (
            <View key={index} style={styles.arrayRow}>
              <TextInput
                style={[styles.input, styles.flexOne]}
                placeholder="Add a benefit..."
                placeholderTextColor="#9CA3AF"
                value={benefit}
                onChangeText={(text) => handleArrayInput('benefits', index, text)}
              />
              <TouchableOpacity onPress={() => removeArrayItem('benefits', index)} style={styles.iconButton}>
                <Minus size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Expiry Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listing Expires On</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={formData.expiresAt}
            onChangeText={(text) => handleInputChange('expiresAt', text)}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => handleSubmit('draft')}
            disabled={loading}
            style={[styles.actionButton, styles.draftButton, loading && styles.buttonDisabled]}
          >
            <Text style={styles.actionButtonText}>Save as Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSubmit('open')}
            disabled={loading}
            style={[styles.actionButton, styles.publishButton, loading && styles.buttonDisabled]}
          >
            <Text style={styles.actionButtonText}>{loading ? 'Publishing...' : 'Publish Job'}</Text>
          </TouchableOpacity>
        </View>
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
    marginTop: 4,
  },
  viewJobsButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewJobsText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
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
  logoSection: {
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexOne: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
  },
  picker: {
    color: '#FFFFFF',
  },
  arrayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconButton: {
    padding: 8,
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
  draftButton: {
    backgroundColor: '#1F2937',
  },
  publishButton: {
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
  applicationsSection: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  applicationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  applicationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applicationsButtonText: {
    color: '#111827',
    fontWeight: '600',
    marginLeft: 4,
  },
  applicationsList: {
    marginBottom: 16,
  },
  applicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    marginBottom: 12,
  },
  applicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  applicantDetails: {},
  applicantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  applicantUsername: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  badge: {
    backgroundColor: 'rgba(6,182,212,0.1)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#06B6D4',
  },
  applicationStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  statusUnviewed: {
    backgroundColor: 'rgba(234,179,8,0.1)',
    color: '#EAB308',
  },
  statusPending: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    color: '#3B82F6',
  },
  statusAccepted: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    color: '#10B981',
  },
  statusRejected: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    color: '#EF4444',
  },
  moreApplications: {
    alignItems: 'center',
    marginTop: 8,
  },
  moreApplicationsText: {
    color: '#06B6D4',
    fontSize: 14,
  },
  noApplications: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noApplicationsText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  detailsLink: {
    fontSize: 14,
    color: '#06B6D4',
  },
});
