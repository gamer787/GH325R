import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { ChevronLeft, DollarSign, Clock, Users, Send } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

// Define the types for your navigator's routes and their parameters.
type RootStackParamList = {
  SponsoredHub: undefined;
  Profile: { username: string };
  FundInfo: undefined;
};

interface SponsoredContent {
  id: string;
  title: string;
  description: string;
  content_url: string;
  budget: number;
  target_audience: string[];
  status: string;
  views: number;
  start_time: string;
  end_time: string;
  created_at: string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export default function SponsoredDetails(): React.JSX.Element {
  // Use the typed navigation so that TypeScript knows which routes are available.
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const [content, setContent] = useState<SponsoredContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState({
    portfolio_url: '',
    cover_letter: '',
  });

  useEffect(() => {
    loadContent();
    checkIfApplied();
    // For demo, assume eligibility is determined elsewhere; here we simply mark as eligible.
    setIsEligible(true);
  }, [id]);

  const loadContent = async () => {
    try {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('sponsored_content')
        .select(
          `*, user:user_id (
            username,
            display_name,
            avatar_url
          )`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      setContent(data);
      // Check if the user has already applied
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: applicationData } = await supabase
          .from('sponsored_content_applications')
          .select('id')
          .eq('content_id', id)
          .eq('applicant_id', user.id)
          .maybeSingle();
        setHasApplied(!!applicationData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    // Additional eligibility checks can be added here
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setError(null);
      setSuccess(null);
      if (!application.cover_letter.trim()) {
        throw new Error('Please provide a cover letter');
      }
      const { error } = await supabase
        .from('sponsored_content_applications')
        .insert({
          content_id: id,
          portfolio_url: application.portfolio_url,
          cover_letter: application.cover_letter,
        });
      if (error) throw error;
      setSuccess('Application submitted successfully!');
      setHasApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (!content) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Content not found</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SponsoredHub')} style={styles.linkButton}>
          <Text style={styles.linkText}>Back to Sponsored Content</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('SponsoredHub')} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sponsored Content Details</Text>
      </View>

      {/* Content Header */}
      <View style={styles.contentHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: content.user.username })}>
            <Image
              source={{ uri: content.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(content.user.display_name)}&background=random` }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.userDetails}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: content.user.username })}>
              <Text style={styles.displayName}>{content.user.display_name}</Text>
            </TouchableOpacity>
            <Text style={styles.contentTitle}>{content.title}</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <DollarSign size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>₹{content.budget.toLocaleString()}</Text>
              </View>
              <View style={styles.infoItem}>
                <Clock size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>
                  {format(new Date(content.start_time), 'MMM d')} - {format(new Date(content.end_time), 'MMM d')}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Users size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>{content.views} views</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Content Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Preview</Text>
        {content.content_url.includes('.mp4') ? (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoPlaceholderText}>Video Preview</Text>
          </View>
        ) : (
          <Image source={{ uri: content.content_url }} style={styles.contentImage} />
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{content.description}</Text>
      </View>

      {/* Target Audience */}
      {content.target_audience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Audience</Text>
          <View style={styles.tagContainer}>
            {content.target_audience.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Application Form */}
      {content.status === 'active' && !hasApplied ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply for this Opportunity</Text>
          {!isEligible ? (
            <View style={styles.notEligibleContainer}>
              <Text style={styles.notEligibleTitle}>Not Eligible</Text>
              <Text style={styles.notEligibleText}>
                To apply for sponsored content opportunities, you must meet the following criteria:
              </Text>
              <View style={styles.criteriaList}>
                <Text style={styles.criteriaItem}>• 2,000+ accepted friend requests</Text>
                <Text style={styles.criteriaItem}>• 45+ bangers posted</Text>
                <Text style={styles.criteriaItem}>• 30+ vibes posted</Text>
                <Text style={styles.criteriaItem}>• Follow 15+ business accounts</Text>
                <Text style={styles.criteriaItem}>• Account age of 90+ days</Text>
                <Text style={styles.criteriaItem}>• Posted content in the last 30 days</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('FundInfo')}>
                <Text style={styles.eligibilityLink}>Learn more about eligibility</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Portfolio URL (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com/portfolio"
                  placeholderTextColor="#9CA3AF"
                  value={application.portfolio_url}
                  onChangeText={text => setApplication(prev => ({ ...prev, portfolio_url: text }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cover Letter</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us why you're interested in this opportunity..."
                  placeholderTextColor="#9CA3AF"
                  value={application.cover_letter}
                  onChangeText={text => setApplication(prev => ({ ...prev, cover_letter: text }))}
                  multiline
                  numberOfLines={4}
                />
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
              <TouchableOpacity
                onPress={handleApply}
                disabled={applying}
                style={[styles.submitButton, applying && styles.buttonDisabled]}
              >
                <Send size={20} color="#111827" />
                <Text style={styles.submitButtonText}>
                  {applying ? 'Submitting...' : 'Submit Application'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {hasApplied && (
        <View style={styles.messageContainer}>
          <Text style={styles.successText}>You have already applied for this opportunity</Text>
        </View>
      )}

      {content.status !== 'active' && (
        <View style={[styles.messageContainer, { borderColor: '#EF4444' }]}>
          <Text style={styles.errorText}>This opportunity is no longer accepting applications</Text>
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
    backgroundColor: '#111827',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#D1D5DB',
    fontSize: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#D1D5DB',
    fontSize: 14,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  messageContainer: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
    textAlign: 'center',
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    color: '#06B6D4',
    fontSize: 16,
  },
  contentHeader: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  statusText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  formContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  videoPlaceholder: {
    height: 250,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  videoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  contentImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  notEligibleContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  notEligibleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  notEligibleText: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 8,
  },
  criteriaList: {
    marginVertical: 8,
  },
  criteriaItem: {
    color: '#D1D5DB',
    fontSize: 14,
    marginVertical: 2,
  },
  eligibilityLink: {
    color: '#06B6D4',
    fontSize: 14,
    marginTop: 8,
  },
});
