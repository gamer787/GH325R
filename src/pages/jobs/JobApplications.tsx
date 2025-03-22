import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Building2, Download, CheckCircle, XCircle, Clock, Eye } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface Application {
  id: string;
  applicant_id: string;
  status: 'unviewed' | 'pending' | 'accepted' | 'rejected' | 'on_hold';
  created_at: string;
  updated_at: string;
  resume_url: string;
  cover_letter: string;
  applicant_name: string;
  applicant_username: string;
  applicant_avatar: string;
  applicant_badge?: {
    role: string;
  };
  // Additional fields for detailed view
  applicant_email?: string;
  applicant_phone?: string;
  applicant_position?: string;
  applicant_company?: string;
  applicant_experience?: string;
  applicant_location?: string;
  can_relocate?: boolean;
  preferred_locations?: string[];
  salary_negotiable?: boolean;
  applicant_salary?: string;
  applicant_notice?: string;
}

interface JobDetails {
  id: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  location: string;
  type: string;
  status: string;
}

export default function JobApplications(): React.JSX.Element {
  // Cast navigation as any to allow flexible parameters.
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { jobId } = route.params as { jobId: string };

  const [applications, setApplications] = useState<Application[]>([]);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const { data: job, error } = await supabase
        .from('job_listings')
        .select('*')
        .eq('id', jobId)
        .single();
      if (error) throw error;
      setJobDetails(job);
    } catch (err) {
      console.error('Error loading job details:', err);
    }
  };

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_job_applications', {
        job_id: jobId,
      });
      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: Application['status']) => {
    try {
      const { error } = await supabase.rpc('update_application_status', {
        application_id: applicationId,
        new_status: newStatus,
      });
      if (error) throw error;
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      if (newStatus === 'accepted') {
        const { error: updateError } = await supabase
          .from('job_listings')
          .update({ status: 'closed' })
          .eq('id', jobId);
        if (updateError) throw updateError;
        if (jobDetails) {
          setJobDetails({ ...jobDetails, status: 'closed' });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update application status');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('JobsHub')} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Applications</Text>
          {jobDetails && (
            <Text style={styles.headerSubtitle}>
              {jobDetails.title} • {jobDetails.company_name}
            </Text>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {applications.length === 0 ? (
        <View style={styles.noApplications}>
          <Building2 size={48} color="#9CA3AF" />
          <Text style={styles.noApplicationsTitle}>No applications yet</Text>
          <Text style={styles.noApplicationsSubtitle}>
            When candidates apply for this position, they'll appear here
          </Text>
        </View>
      ) : (
        <View style={styles.applicationsSection}>
          {applications.map(application => (
            <TouchableOpacity
              key={application.id}
              onPress={() => setSelectedApplication(application)}
              style={styles.applicationCard}
            >
              <View style={styles.applicationCardContent}>
                <TouchableOpacity onPress={() => {
                  navigation.navigate('Profile', { username: application.applicant_username });
                }}>
                  <Image
                    source={{
                      uri: application.applicant_avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(application.applicant_name)}&background=random`
                    }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>
                <View style={styles.applicationInfo}>
                  <TouchableOpacity onPress={() => {
                    navigation.navigate('Profile', { username: application.applicant_username });
                  }}>
                    <Text style={styles.applicantName}>{application.applicant_name}</Text>
                  </TouchableOpacity>
                  <View style={styles.applicantDetailsRow}>
                    <Text style={styles.applicantUsername}>@{application.applicant_username}</Text>
                    {application.applicant_badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{application.applicant_badge.role}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.applicationStatusRow}>
                    <View style={[
                      styles.statusBadge,
                      application.status === 'unviewed'
                        ? styles.statusUnviewed
                        : application.status === 'pending'
                        ? styles.statusPending
                        : application.status === 'on_hold'
                        ? styles.statusOnHold
                        : application.status === 'accepted'
                        ? styles.statusAccepted
                        : styles.statusRejected,
                    ]}>
                      <Clock size={16} color="#FFFFFF" style={styles.statusIcon} />
                      <Text style={styles.statusText}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.applicationDate}>
                      Applied {format(new Date(application.created_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Application Details Modal */}
      {selectedApplication && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <Image
                    source={{
                      uri: selectedApplication.applicant_avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApplication.applicant_name)}&background=random`
                    }}
                    style={styles.modalAvatar}
                  />
                  <View style={styles.modalApplicantInfo}>
                    <TouchableOpacity onPress={() => {
                      navigation.navigate('Profile', { username: selectedApplication.applicant_username });
                      setSelectedApplication(null);
                    }}>
                      <Text style={styles.modalApplicantName}>{selectedApplication.applicant_name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalApplicantUsername}>@{selectedApplication.applicant_username}</Text>
                    <View style={styles.modalStatusRow}>
                      <View style={[
                        styles.statusBadge,
                        selectedApplication.status === 'unviewed'
                          ? styles.statusUnviewed
                          : selectedApplication.status === 'pending'
                          ? styles.statusPending
                          : selectedApplication.status === 'on_hold'
                          ? styles.statusOnHold
                          : selectedApplication.status === 'accepted'
                          ? styles.statusAccepted
                          : styles.statusRejected,
                      ]}>
                        <Clock size={16} color="#FFFFFF" style={styles.statusIcon} />
                        <Text style={styles.statusText}>
                          {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.applicationDate}>
                        Applied {format(new Date(selectedApplication.created_at), 'MMM d, yyyy')}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedApplication(null)} style={styles.modalCloseButton}>
                  <XCircle size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                {selectedApplication.resume_url && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(selectedApplication.resume_url)}
                    style={styles.resumeButton}
                  >
                    <Download size={20} color="#FFFFFF" />
                    <Text style={styles.resumeButtonText}>Download Resume</Text>
                  </TouchableOpacity>
                )}
                {selectedApplication.cover_letter && (
                  <View style={styles.coverLetterSection}>
                    <Text style={styles.sectionHeaderText}>Cover Letter</Text>
                    <View style={styles.coverLetterContainer}>
                      <Text style={styles.coverLetterText}>{selectedApplication.cover_letter}</Text>
                    </View>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailHeader}>Contact</Text>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Email:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_email}</Text>
                        </View>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Phone:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_phone}</Text>
                        </View>
                      </View>
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailHeader}>Experience</Text>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Current Role:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_position || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Company:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_company || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Experience:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_experience || 'N/A'}</Text>
                        </View>
                      </View>
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailHeader}>Location</Text>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Current:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_location}</Text>
                        </View>
                        {selectedApplication.can_relocate && (
                          <Text style={styles.relocateText}>Willing to relocate</Text>
                        )}
                        {selectedApplication.preferred_locations?.length ? (
                          <View style={styles.detailContainer}>
                            <Text style={styles.detailLabel}>Preferred:</Text>
                            <Text style={styles.detailValue}>
                              {selectedApplication.preferred_locations.join(', ')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.detailColumn}>
                        <Text style={styles.detailHeader}>Compensation</Text>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Expected:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_salary}</Text>
                          {selectedApplication.salary_negotiable && (
                            <Text style={styles.negotiableText}>(Negotiable)</Text>
                          )}
                        </View>
                        <View style={styles.detailContainer}>
                          <Text style={styles.detailLabel}>Notice Period:</Text>
                          <Text style={styles.detailValue}>{selectedApplication.applicant_notice}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => handleStatusChange(selectedApplication.id, 'on_hold')}
                  style={[styles.modalActionButton, styles.onHoldButton]}
                >
                  <Text style={styles.modalActionButtonText}>Put On Hold</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatusChange(selectedApplication.id, 'accepted')}
                  style={[styles.modalActionButton, styles.acceptButton]}
                >
                  <Text style={styles.modalActionButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStatusChange(selectedApplication.id, 'rejected')}
                  style={[styles.modalActionButton, styles.rejectButton]}
                >
                  <Text style={styles.modalActionButtonText}>Reject</Text>
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
    padding: 16,
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
  noApplications: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noApplicationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  noApplicationsSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
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
  applicationCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  applicationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  applicantDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  applicationStatusRow: {
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  statusUnviewed: {
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  statusOnHold: {
    backgroundColor: 'rgba(128,90,213,0.1)',
  },
  statusAccepted: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  applicationDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  moreApplications: {
    alignItems: 'center',
    marginTop: 8,
  },
  moreApplicationsText: {
    color: '#06B6D4',
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
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  modalApplicantInfo: {
    flex: 1,
  },
  modalApplicantName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalApplicantUsername: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  coverLetterSection: {
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  coverLetterContainer: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
  },
  coverLetterText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailColumn: {
    width: '48%',
    marginBottom: 16,
  },
  detailHeader: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailContainer: {
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  relocateText: {
    fontSize: 12,
    color: '#06B6D4',
  },
  negotiableText: {
    fontSize: 12,
    color: '#06B6D4',
    marginLeft: 4,
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
  onHoldButton: {
    backgroundColor: 'rgba(128,90,213,0.1)',
  },
  acceptButton: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  rejectButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

