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
  Modal,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import {
  ChevronLeft,
  Building2,
  MapPin,
  Clock,
  Eye,
  Users,
  Edit,
  X,
  Search,
  SortAsc,
  Plus,
  Trash2,
  AlertTriangle,
  Download,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface JobListing {
  id: string;
  title: string;
  company_name: string;
  company_logo: string;
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
  applications_count: number;
  user_id: string;
}

// Define the routes available in your navigator
type RootStackParamList = {
  Hub: undefined;
  JobDetails: { id: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ViewJobs() {
  const navigation = useNavigation<NavigationProp>();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'open' | 'closed' | 'draft'>('open');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'applications'>('date');
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userApplications, setUserApplications] = useState<Set<string>>(new Set());
  const [jobToDelete, setJobToDelete] = useState<JobListing | null>(null);
  const [hasCreatedJobs, setHasCreatedJobs] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [filterType]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
      checkAccountType(user?.id);
    });
  }, []);

  const checkAccountType = async (userId: string | undefined) => {
    if (!userId) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', userId)
        .single();
      setIsBusinessAccount(profile?.account_type === 'business');
      if (profile?.account_type === 'business') {
        checkUserJobs(userId);
      }
    } catch (error) {
      console.error('Error checking account type:', error);
    }
  };

  const checkUserJobs = async (userId: string) => {
    try {
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'open')
        .limit(1);
      setHasCreatedJobs(!!jobs?.length);
    } catch (err) {
      console.error('Error checking user jobs:', err);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Hub');
        return;
      }
      let query = supabase
        .from('job_listings')
        .select(`
          *,
          applications:job_applications(count)
        `);
      if (filterType !== 'all') {
        query = query.eq('status', filterType);
      } else {
        query = query.neq('status', 'closed');
      }
      if (isBusinessAccount) {
        query = query.or(`user_id.eq.${user.id},and(status.eq.open,user_id.neq.${user.id})`);
      } else {
        query = query.eq('status', 'open');
      }
      const { data: jobsData, error: jobsError } = await query.order('created_at', { ascending: false });
      if (jobsError) throw jobsError;

      let userApps: string[] = [];
      if (user) {
        const { data: applications } = await supabase
          .from('job_applications')
          .select('job_id')
          .eq('applicant_id', user.id);
        userApps = applications?.map((app: any) => app.job_id) || [];
      }
      const transformedJobs = jobsData?.map((job: any) => ({
        ...job,
        applications_count: job.applications?.[0]?.count || 0,
        has_applied: userApps.includes(job.id),
      })) || [];
      setJobs(transformedJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.company_name.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower) ||
      job.description.toLowerCase().includes(searchLower)
    );
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return b.views - a.views;
      case 'applications':
        return b.applications_count - a.applications_count;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const handleStatusChange = async (jobId: string, newStatus: 'open' | 'closed') => {
    try {
      const { error } = await supabase
        .from('job_listings')
        .update({ status: newStatus })
        .eq('id', jobId);
      if (error) throw error;
      setJobs((prev) =>
        prev.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;
    try {
      const { data, error } = await supabase.rpc('delete_job_listing', { job_id: jobToDelete.id });
      if (error) throw error;
      if (!data) throw new Error('Failed to delete job listing');
      setJobs((prev) => prev.filter((job) => job.id !== jobToDelete.id));
      setJobToDelete(null);
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Hub')} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Job Listings</Text>
          <Text style={styles.headerSubtitle}>
            {isBusinessAccount ? 'Manage your job listings' : 'Find your next opportunity'}
          </Text>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            placeholder="Search jobs by title, description, or location..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        </View>
        <View style={styles.filterSortContainer}>
          <View style={styles.selectContainer}>
            <Picker
              selectedValue={filterType}
              onValueChange={(itemValue: string) =>
                setFilterType(itemValue as 'all' | 'open' | 'closed' | 'draft')
              }
              style={styles.picker}
            >
              <Picker.Item label="All Jobs" value="all" />
              <Picker.Item label="Open" value="open" />
              <Picker.Item label="Closed" value="closed" />
              <Picker.Item label="Drafts" value="draft" />
            </Picker>
          </View>
          <TouchableOpacity
            onPress={() => setSortBy((current) => (current === 'date' ? 'views' : 'date'))}
            style={styles.sortButton}
          >
            <SortAsc size={20} color="#FFFFFF" />
            <Text style={styles.sortButtonText}>
              {sortBy === 'date' ? 'Newest' : 'Most Viewed'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Job Listings */}
      {jobs.length === 0 ? (
        <View style={styles.noJobsContainer}>
          <Building2 size={48} color="#9CA3AF" />
          <Text style={styles.noJobsTitle}>No open positions available</Text>
          <Text style={styles.noJobsSubtitle}>Check back later for new opportunities</Text>
        </View>
      ) : (
        <View style={styles.jobsList}>
          {sortedJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => navigation.navigate('JobDetails', { id: job.id })}
            >
              <View style={styles.jobCardContent}>
                <View style={styles.jobCardLeft}>
                  <View style={styles.logoWrapper}>
                    {job.company_logo ? (
                      <Image source={{ uri: job.company_logo }} style={styles.companyLogo} />
                    ) : (
                      <Building2 size={32} color="#9CA3AF" />
                    )}
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.companyName}>{job.company_name}</Text>
                    <View style={styles.jobDetailsRow}>
                      <View style={styles.jobDetailItem}>
                        <MapPin size={16} color="#9CA3AF" />
                        <Text style={styles.jobDetailText}>{job.location}</Text>
                      </View>
                      <View style={styles.jobDetailItem}>
                        <Clock size={16} color="#9CA3AF" />
                        <Text style={styles.jobDetailText}>{job.type}</Text>
                      </View>
                      {job.salary_range ? (
                        <View style={styles.salaryContainer}>
                          <Text style={styles.salaryText}>{job.salary_range}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
                <View style={styles.jobCardRight}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('JobDetails', { id: job.id })}
                    style={styles.viewButton}
                  >
                    <Eye size={20} color="#111827" />
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {job.expires_at && (
                <Text style={styles.expiresText}>
                  Applications close {format(new Date(job.expires_at), 'MMM d, yyyy')}
                </Text>
              )}
              <View style={styles.jobStats}>
                <View style={styles.statItem}>
                  <Eye size={16} color="#9CA3AF" style={styles.statIcon} />
                  <Text style={styles.statText}>{job.views} views</Text>
                </View>
                <View style={styles.statItem}>
                  <Users size={16} color="#9CA3AF" style={styles.statIcon} />
                  <Text style={styles.statText}>{job.applications_count} applications</Text>
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
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <AlertTriangle size={24} color="#EF4444" />
                  <Text style={styles.modalHeaderTitle}>Delete Job Listing</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setJobToDelete(null)}
                  style={styles.modalCloseButton}
                >
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete this job listing? This action cannot be undone.
              </Text>
              <View style={styles.modalPreview}>
                <Text style={styles.modalPreviewTitle}>{jobToDelete.title}</Text>
                <Text style={styles.modalPreviewCompany}>{jobToDelete.company_name}</Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => setJobToDelete(null)}
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

      {error && (
        <View style={styles.errorPopup}>
          <Text style={styles.errorPopupText}>{error}</Text>
        </View>
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
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  errorPopup: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    maxWidth: 300,
  },
  errorPopupText: {
    color: '#EF4444',
    fontSize: 14,
  },
  // Search and filter styles
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchIcon: {
    marginLeft: 8,
  },
  filterSortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  selectContainer: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  picker: {
    color: '#FFFFFF',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortButtonText: {
    marginLeft: 4,
    color: '#FFFFFF',
    fontSize: 14,
  },
  // No jobs styles
  noJobsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  noJobsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  noJobsSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  // Jobs list styles
  jobsList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  jobCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
    padding: 12,
  },
  jobCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jobCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  jobInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyName: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  jobDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  // Added salary styles
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
  jobCardRight: {
    marginLeft: 12,
  },
  viewButton: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#111827',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  expiresText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#374151',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openStatus: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  closedStatus: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  statusBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
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
  modalCloseButton: {
    padding: 8,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
  modalMessage: {
    padding: 16,
    fontSize: 16,
    color: '#D1D5DB',
  },
  modalPreview: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  modalPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalPreviewCompany: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
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
});

