import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Building2, Download, Clock, Eye } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface Application {
  id: string;
  job_id: string;
  status: 'unviewed' | 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  resume_url: string;
  cover_letter: string;
  job_title: string;
  company_name: string;
  company_logo: string;
  expected_salary?: string;
  notice_period?: string;
  current_role?: string;
}

// Define the routes available in your navigator
type RootStackParamList = {
  JobsHub: undefined;
  JobDetails: { id: string };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function UserApplications() {
  const navigation = useNavigation<NavigationProp>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
      if (user) {
        loadApplications(user.id);
      }
    });
  }, []);

  const loadApplications = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_applications', {
        applicant_id: userId,
      });
      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (error) {
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
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('JobsHub')} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
      </View>

      {applications.length === 0 ? (
        <View style={styles.noApplications}>
          <Building2 size={48} color="#9CA3AF" />
          <Text style={styles.noApplicationsTitle}>No applications yet</Text>
          <Text style={styles.noApplicationsSubtitle}>
            Start applying for jobs to see your applications here
          </Text>
        </View>
      ) : (
        <View style={styles.applicationsList}>
          {applications.map((application) => (
            <View key={application.id} style={styles.applicationCard}>
              <View style={styles.cardContent}>
                <View style={styles.leftSection}>
                  <View style={styles.logoContainer}>
                    {application.company_logo ? (
                      <Image
                        source={{ uri: application.company_logo }}
                        style={styles.companyLogo}
                      />
                    ) : (
                      <Building2 size={32} color="#9CA3AF" />
                    )}
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>
                      {application.job_title}
                      {application.current_role ? (
                        <Text style={styles.jobRole}> ({application.current_role})</Text>
                      ) : null}
                    </Text>
                    <Text style={styles.companyName}>{application.company_name}</Text>
                    <View style={styles.statusRow}>
                      <View style={styles.statusBadge}>
                        <Clock size={16} color="#FFFFFF" style={styles.statusIcon} />
                        <Text style={styles.statusText}>
                          {application.status.charAt(0).toUpperCase() +
                            application.status.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>
                        Applied {format(new Date(application.created_at), 'MMM d, yyyy')}
                        {application.expected_salary && (
                          <Text style={styles.detailText}> • Expected: {application.expected_salary}</Text>
                        )}
                        {application.notice_period && (
                          <Text style={styles.detailText}> • Notice: {application.notice_period}</Text>
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rightSection}>
                  {application.resume_url && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(application.resume_url)}
                      style={styles.iconButton}
                    >
                      <Download size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('JobDetails', { id: application.job_id })
                    }
                    style={styles.iconButton}
                  >
                    <Eye size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              {application.cover_letter ? (
                <View style={styles.coverLetterContainer}>
                  <Text style={styles.coverLetterHeader}>Cover Letter</Text>
                  <Text style={styles.coverLetterText}>{application.cover_letter}</Text>
                </View>
              ) : null}
            </View>
          ))}
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
  noApplications: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  noApplicationsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  noApplicationsSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  applicationsList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  applicationCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
    padding: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  jobRole: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  companyName: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  rightSection: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  coverLetterContainer: {
    marginTop: 12,
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
  },
  coverLetterHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  coverLetterText: {
    fontSize: 14,
    color: '#D1D5DB',
  },
});

