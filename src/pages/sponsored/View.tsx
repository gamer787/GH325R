import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  ChevronLeft,
  Plus,
  Building2,
  Clock,
  DollarSign,
  Users,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { Picker } from '@react-native-picker/picker';

type RootStackParamList = {
  Hub: undefined;
  Profile: { username: string };
  SponsoredCreate: undefined;
  SponsoredApplications: { id: string };
  SponsoredDetails: { id: string };
};

interface SponsoredContent {
  id: string;
  title: string;
  description: string;
  content_url: string;
  budget: number;
  target_audience: string[];
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
  views: number;
  start_time: string;
  end_time: string;
  created_at: string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  applications_count: number;
}

export default function ViewSponsored(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [content, setContent] = useState<SponsoredContent[]>([]);
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [contentToDelete, setContentToDelete] = useState<SponsoredContent | null>(null);

  useEffect(() => {
    checkAccountType();
    loadContent();
  }, [filterStatus]);

  const checkAccountType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();
      setIsBusinessAccount(profile?.account_type === 'business');
    } catch (error) {
      console.error('Error checking account type:', error);
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();

      let query = supabase
        .from('sponsored_content')
        .select(`
          *,
          user:user_id (
            username,
            display_name,
            avatar_url
          ),
          applications:sponsored_content_applications(count)
        `);

      if (profile?.account_type === 'business') {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('status', 'active');
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      setContent(
        data?.map(item => ({
          ...item,
          applications_count: item.applications?.[0]?.count || 0,
        })) || []
      );

      setIsBusinessAccount(profile?.account_type === 'business');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (contentId: string, newStatus: SponsoredContent['status']) => {
    try {
      const { error } = await supabase
        .from('sponsored_content')
        .update({ status: newStatus })
        .eq('id', contentId);
      if (error) throw error;
      setContent(prev =>
        prev.map(item => (item.id === contentId ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!contentToDelete) return;
    try {
      const { error } = await supabase
        .from('sponsored_content')
        .delete()
        .eq('id', contentToDelete.id);
      if (error) throw error;
      setContent(prev => prev.filter(item => item.id !== contentToDelete.id));
      setContentToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete content');
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
          <Text style={styles.headerTitle}>Sponsored Content</Text>
          <Text style={styles.headerSubtitle}>
            {isBusinessAccount ? 'Manage your sponsored content' : 'Browse sponsored opportunities'}
          </Text>
        </View>
        {isBusinessAccount && (
          <TouchableOpacity
            onPress={() => navigation.navigate('SponsoredCreate')}
            style={styles.createButton}
          >
            <Plus size={20} color="#111827" />
            <Text style={styles.createButtonText}>Create New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <TouchableOpacity
          onPress={() => setFilterStatus('all')}
          style={[
            styles.filterButton,
            filterStatus === 'all' ? styles.activeFilter : styles.inactiveFilter,
          ]}
        >
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterStatus('active')}
          style={[
            styles.filterButton,
            filterStatus === 'active' ? styles.activeFilter : styles.inactiveFilter,
          ]}
        >
          <Text style={styles.filterButtonText}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterStatus('completed')}
          style={[
            styles.filterButton,
            filterStatus === 'completed' ? styles.activeFilter : styles.inactiveFilter,
          ]}
        >
          <Text style={styles.filterButtonText}>Completed</Text>
        </TouchableOpacity>
      </View>

      {content.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Building2 size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No content found</Text>
          <Text style={styles.emptySubtitle}>
            {isBusinessAccount
              ? 'Create your first sponsored content opportunity'
              : 'Check back later for new opportunities'}
          </Text>
        </View>
      ) : (
        <View style={styles.contentList}>
          {content.map(item => (
            <View key={item.id} style={styles.contentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: item.user.username })}>
                    <Image
                      source={{
                        uri:
                          item.user.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user.display_name)}&background=random`,
                      }}
                      style={styles.avatar}
                    />
                  </TouchableOpacity>
                  <View style={styles.cardInfo}>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: item.user.username })}>
                      <Text style={styles.displayName}>{item.user.display_name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.contentTitle}>{item.title}</Text>
                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <DollarSign size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>{`₹${item.budget.toLocaleString()}`}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Clock size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>
                          {format(new Date(item.start_time), 'MMM d')} - {format(new Date(item.end_time), 'MMM d')}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Eye size={16} color="#9CA3AF" />
                        <Text style={styles.detailText}>{`${item.views} views`}</Text>
                      </View>
                      {isBusinessAccount && (
                        <View style={styles.detailItem}>
                          <Users size={16} color="#9CA3AF" />
                          <Text style={styles.detailText}>{`${item.applications_count} applications`}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[
                    styles.statusBadge,
                    item.status === 'active'
                      ? styles.statusActive
                      : item.status === 'completed'
                      ? styles.statusCompleted
                      : item.status === 'cancelled'
                      ? styles.statusCancelled
                      : styles.statusOther,
                  ]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              {/* Content Preview */}
              <View style={styles.previewContainer}>
                {item.content_url.includes('.mp4') ? (
                  <View style={styles.videoPlaceholder}>
                    <Text style={styles.videoPlaceholderText}>Video Preview</Text>
                  </View>
                ) : (
                  <Image source={{ uri: item.content_url }} style={styles.contentImage} />
                )}
              </View>

              {/* Target Audience */}
              {item.target_audience.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Target Audience</Text>
                  <View style={styles.tagContainer}>
                    {item.target_audience.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {isBusinessAccount ? (
                  <>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('SponsoredApplications', { id: item.id })}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>View Applications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        handleStatusChange(item.id, item.status === 'active' ? 'completed' : 'active')
                      }
                      style={[
                        styles.actionButton,
                        item.status === 'active'
                          ? styles.actionButtonRed
                          : styles.actionButtonGreen,
                      ]}
                    >
                      <Text style={styles.actionButtonText}>
                        {item.status === 'active' ? 'Complete' : 'Reactivate'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SponsoredDetails', { id: item.id })}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Delete Confirmation Modal */}
      {contentToDelete && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderContent}>
                  <AlertTriangle size={24} color="#EF4444" />
                  <Text style={styles.modalHeaderTitle}>Delete Content</Text>
                </View>
                <TouchableOpacity onPress={() => setContentToDelete(null)} style={styles.modalCloseButton}>
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalMessage}>
                Are you sure you want to delete this sponsored content? This action cannot be undone.
              </Text>
              <View style={styles.modalPreview}>
                <Text style={styles.modalPreviewTitle}>{contentToDelete.title}</Text>
                <Text style={styles.modalPreviewCompany}>{contentToDelete.description}</Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setContentToDelete(null)} style={[styles.modalActionButton, styles.cancelButton]}>
                  <Text style={styles.modalActionText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={[styles.modalActionButton, styles.deleteButton]}>
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
    backgroundColor: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
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
    fontSize: 14,
    color: '#9CA3AF',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#06B6D4',
  },
  inactiveFilter: {
    backgroundColor: '#1F2937',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  contentList: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  contentCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardInfo: {
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
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  cardRight: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(107,114,128,0.1)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  statusOther: {
    backgroundColor: 'rgba(55,65,81,0.1)',
  },
  statusBadgeText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  previewContainer: {
    marginTop: 4,
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
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
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
    fontSize: 14,
    color: '#D1D5DB',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionButtonRed: {
    backgroundColor: '#EF4444',
  },
  actionButtonGreen: {
    backgroundColor: '#10B981',
  },
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
  modalCloseButton: {
    padding: 8,
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
});
