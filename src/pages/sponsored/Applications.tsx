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
import {
  ChevronLeft,
  Download,
  Clock,
  Eye,
  Building2,
  Search,
  SortAsc,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

// Define the Application interface
interface Application {
  id: string;
  job_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  portfolio_url: string | null;
  cover_letter: string;
  applicant: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    badge?: {
      role: string;
    };
  };
}

// Define your navigation routes
type RootStackParamList = {
  JobsHub: undefined;
  JobDetails: { id: string };
  Profile: { username: string };
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
      const { data, error } = await supabase.rpc('get_user_applications', { applicant_id: userId });
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('JobsHub')} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
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
            Start applying for jobs to see your applications here
          </Text>
        </View>
      ) : (
        <View style={styles.applicationsList}>
          {applications.map((application) => (
            <View key={application.id} style={styles.applicationCard}>
              <View style={styles.cardRow}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Profile', { username: application.applicant.username })
                  }
                >
                  <Image
                    source={{
                      uri:
                        application.applicant.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          application.applicant.display_name
                        )}&background=random`,
                    }}
                    style={styles.avatar}
                  />
                </TouchableOpacity>
                <View style={styles.applicationInfo}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('Profile', { username: application.applicant.username })
                    }
                  >
                    <Text style={styles.applicantName}>{application.applicant.display_name}</Text>
                  </TouchableOpacity>
                  <Text style={styles.applicantUsername}>@{application.applicant.username}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusBadge}>
                      <Clock size={16} color="#FFFFFF" style={styles.statusIcon} />
                      <Text style={styles.statusText}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>
                      Applied {format(new Date(application.created_at), 'MMM d, yyyy')}
                    </Text>
                  </View>
                </View>
              </View>
              {application.cover_letter ? (
                <View style={styles.coverLetterContainer}>
                  <Text style={styles.coverLetterHeader}>Cover Letter</Text>
                  <Text style={styles.coverLetterText}>{application.cover_letter}</Text>
                </View>
              ) : null}
              <View style={styles.cardActions}>
                {application.portfolio_url && (
                  <TouchableOpacity
                    onPress={() => {
                      if (application.portfolio_url) {
                        Linking.openURL(application.portfolio_url);
                      }
                    }}
                    style={styles.actionButton}
                  >
                    <Download size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => navigation.navigate('JobDetails', { id: application.job_id })}
                  style={styles.actionButton}
                >
                  <Eye size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  applicationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  applicantUsername: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234,179,8,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  // Added missing cover letter styles
  coverLetterContainer: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
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

