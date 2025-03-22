import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ChevronLeft,
  Building2,
  MapPin,
  Clock,
  Eye,
  Send,
  X,
  Check,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface JobListing {
  id: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  location: string;
  type: string;
  salary_range: string;
  description: string;
  requirements: string[];
  benefits: string[];
  status: 'open' | 'closed' | 'draft';
  created_at: string;
  expires_at: string | null;
  views: number;
  user_id: string;
}

export default function JobDetails() {
  // Using generic any to bypass route name type issues
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { id } = route.params as { id: string };

  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  // Application form state (for non-owners)
  const [application, setApplication] = useState({
    coverLetter: '',
    resumeUrl: '',
    email: '',
    phone: '',
    expectedSalary: '',
    isNegotiable: false,
    noticePeriod: '',
    currentCompany: '',
    currentRole: '',
    yearsOfExperience: '',
    currentLocation: '',
    willingToRelocate: false,
    preferredLocations: '',
  });
  const [hasApplied, setHasApplied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      if (!id) throw new Error('Job ID is required');

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: jobData, error: jobError } = await supabase
        .from('job_listings')
        .select('*')
        .eq('id', id)
        .single();
      if (jobError) throw jobError;
      if (!jobData) throw new Error('Job not found');

      // Check if current user is the owner
      setIsOwner(user?.id === jobData.user_id);

      // Increment views if not owner
      if (!user || user.id !== jobData.user_id) {
        await supabase.rpc('increment_job_views', { job_id: id });
      }
      setJob(jobData);

      // Check if user has already applied (for non-owners)
      if (user) {
        const { data: existingApplication } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle();
        setHasApplied(!!existingApplication);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  // Stub for resume upload – in a real native app use expo-image-picker
  const handleResumeUpload = async () => {
    setError('Resume upload is not implemented in this demo.');
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: applicationId, error } = await supabase.rpc('submit_job_application', {
        target_job_id: id,
        resume_url: application.resumeUrl,
        cover_letter: application.coverLetter,
        email: application.email,
        phone: application.phone,
        expected_salary: application.expectedSalary,
        is_negotiable: application.isNegotiable,
        notice_period: application.noticePeriod,
        current_company: application.currentCompany,
        current_role: application.currentRole,
        years_of_experience: application.yearsOfExperience,
        current_location: application.currentLocation,
        willing_to_relocate: application.willingToRelocate,
        preferred_locations: application.preferredLocations,
      });
      if (error) throw error;
      setHasApplied(true);
      setSuccess('Application submitted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleStatusChange = async (newStatus: 'open' | 'closed') => {
    try {
      const { error } = await supabase
        .from('job_listings')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      if (job) {
        setJob({ ...job, status: newStatus });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  const handleDelete = async () => {
    try {
      const { data, error } = await supabase.rpc('delete_job_listing', { job_id: id });
      if (error) throw error;
      if (!data) throw new Error('Failed to delete job listing');
      navigation.navigate('JobsHub');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job listing');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }
  if (error || !job) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error || 'Job not found'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('JobsHub')} style={styles.backLink}>
          <Text style={styles.linkText}>Back to Jobs</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('JobsHub')} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
      </View>

      <View style={styles.section}>
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.logoContainer}>
            {job.company_logo ? (
              <Image source={{ uri: job.company_logo }} style={styles.companyLogo} />
            ) : (
              <Building2 size={48} color="#9CA3AF" />
            )}
          </View>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.companyName}>{job.company_name}</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MapPin size={20} color="#9CA3AF" />
                <Text style={styles.infoText}>{job.location}</Text>
              </View>
              <View style={styles.infoItem}>
                <Clock size={20} color="#9CA3AF" />
                <Text style={styles.infoText}>{job.type}</Text>
              </View>
              {job.salary_range ? (
                <View style={styles.salaryContainer}>
                  <Text style={styles.salaryText}>{job.salary_range}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {isOwner && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('JobEdit', { id: job.id })}
                style={styles.editButton}
              >
                <Edit size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  handleStatusChange(job.status === 'open' ? 'closed' : 'open')
                }
                style={[
                  styles.statusButton,
                  job.status === 'open' ? styles.closeButton : styles.reopenButton,
                ]}
              >
                {job.status === 'open' ? (
                  <>
                    <X size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Close Listing</Text>
                  </>
                ) : (
                  <>
                    <Check size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Reopen Listing</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                style={styles.ownerDeleteButton}
              >
                <Trash2 size={20} color="#EF4444" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Job Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Description</Text>
        {job.description.split('\n').map((paragraph, index) => (
          <Text key={index} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>

      {/* Requirements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Requirements</Text>
        {job.requirements.map((req, index) => (
          <View key={index} style={styles.bulletItem}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{req}</Text>
          </View>
        ))}
      </View>

      {/* Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Benefits</Text>
        {job.benefits.map((benefit, index) => (
          <View key={index} style={styles.bulletItem}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{benefit}</Text>
          </View>
        ))}
      </View>

      {/* Status & Footer Info */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.infoRow}>
            <Eye size={16} color="#9CA3AF" style={styles.footerIcon} />
            <Text style={styles.footerText}>{job.views} views</Text>
          </View>
          <Text style={styles.footerText}>
            Posted {format(new Date(job.created_at), 'MMM d, yyyy')}
          </Text>
          {job.expires_at && (
            <Text style={styles.footerText}>
              Expires {format(new Date(job.expires_at), 'MMM d, yyyy')}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            job.status === 'open' ? styles.openStatus : styles.closedStatus,
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Application Form (if job is open and user is not owner and hasn't applied) */}
      {job.status === 'open' && !hasApplied && !isOwner && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply for this Position</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#9CA3AF"
              value={application.email}
              onChangeText={(text: string) =>
                setApplication((prev) => ({ ...prev, email: text }))
              }
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9CA3AF"
              value={application.phone}
              onChangeText={(text: string) =>
                setApplication((prev) => ({ ...prev, phone: text }))
              }
              keyboardType="phone-pad"
            />
          </View>
          <TouchableOpacity
            onPress={handleApply}
            disabled={applying || !application.email || !application.phone}
            style={[styles.submitButton, applying && styles.buttonDisabled]}
          >
            <Send size={20} color="#111827" />
            <Text style={styles.submitButtonText}>
              {applying ? 'Submitting...' : 'Submit Application'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Owner-only Manage Applications Section */}
      {isOwner && job.status === 'open' && (
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>Manage Applications</Text>
              <Text style={styles.sectionSubtitle}>
                Review and manage job applications
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('JobApplications', { id })}
              style={styles.manageButton}
            >
              <Eye size={20} color="#111827" />
              <Text style={styles.manageButtonText}>View All Applications</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Applied or Closed Messages */}
      {hasApplied && (
        <View style={styles.messageContainer}>
          <Text style={styles.successMessage}>
            You have already applied for this position
          </Text>
        </View>
      )}
      {job.status === 'closed' && !isOwner && (
        <View style={styles.messageContainer}>
          <Text style={styles.errorMessage}>
            This position is no longer accepting applications
          </Text>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <AlertTriangle size={24} color="#EF4444" />
                  <Text style={styles.modalHeaderTitle}>Delete Job Listing</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(false)}
                  style={styles.modalCloseButton}
                >
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete this job listing? This action cannot be undone.
              </Text>
              <View style={styles.modalPreview}>
                <Text style={styles.modalPreviewTitle}>{job.title}</Text>
                <Text style={styles.modalPreviewCompany}>{job.company_name}</Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setShowDeleteConfirm(false)}
                  style={[styles.modalActionButton, styles.cancelButton]}
                >
                  <Text style={styles.modalActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.modalActionButton, styles.deleteButton]}
                >
                  <Text style={styles.modalActionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  backLink: {
    marginTop: 16,
  },
  linkText: {
    color: '#06B6D4',
    fontSize: 16,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  manageButtonText: {
    color: '#111827',
    fontWeight: '600',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  paragraph: {
    marginBottom: 12,
    color: '#D1D5DB',
    fontSize: 16,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    backgroundColor: '#06B6D4',
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },
  bulletText: {
    color: '#D1D5DB',
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  logoContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  jobInfo: {
    flex: 1,
    marginLeft: 16,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  ownerActions: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: '#EF4444',
  },
  reopenButton: {
    backgroundColor: '#10B981',
  },
  ownerDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  footerLeft: {
    flex: 1,
  },
  footerIcon: {
    marginRight: 4,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  openStatus: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  closedStatus: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 8,
    color: '#FFFFFF',
    backgroundColor: '#111827',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Additional styles for salary info
  salaryContainer: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  salaryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    width: '100%',
    maxWidth: 480,
    borderRadius: 8,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalMessage: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    color: '#D1D5DB',
  },
  modalPreview: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  modalPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalPreviewCompany: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#374151',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#1F2937',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Additional styles added for missing keys
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageContainer: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  successMessage: {
    color: '#10B981',
    fontSize: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
