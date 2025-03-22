import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserPlus } from 'lucide-react-native';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { FriendRequestModal } from '../components/FriendRequestModal';
import { respondToFriendRequest } from '../lib/friends';
import type { FriendRequest } from '../lib/friends';

export default function Notifications() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<FriendRequest | null>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch friend requests for the current user
      const { data: requests, error: requestsError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:sender_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setFriendRequests(requests || []);
      
      // For simplicity, other notifications are omitted in this example.
      setNotifications([]); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      setError(null);
      const { error } = await respondToFriendRequest(request.id, true);
      if (error) throw error;
      // Optionally, you might show an alert here to indicate success
      setError('Friend request accepted successfully!');
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend request');
    }
    setSelectedRequest(null);
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    try {
      setError(null);
      const { error } = await respondToFriendRequest(request.id, false);
      if (error) throw error;
      setError('Friend request rejected');
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject friend request');
    }
    setSelectedRequest(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (error && friendRequests.length === 0 && notifications.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {friendRequests.length === 0 && notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <View style={styles.notificationsContainer}>
          {friendRequests.map((request) => (
            <View key={request.id} style={styles.notificationCard}>
              <View style={styles.notificationInfo}>
                <View style={styles.iconContainer}>
                  <UserPlus size={24} color="#06B6D4" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.senderName}>{request.sender?.display_name}</Text>
                  <Text style={styles.senderUsername}>@{request.sender?.username}</Text>
                  <Text style={styles.timestamp}>
                    Sent you a friend request • {format(new Date(request.created_at), 'MMM d, h:mm a')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setSelectedRequest(request)} 
                style={styles.viewButton}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Friend Request Modal */}
      {selectedRequest && (
        <FriendRequestModal
          username={selectedRequest.sender?.username || ''}
          displayName={selectedRequest.sender?.display_name || ''}
          avatarUrl={selectedRequest.sender?.avatar_url || ''}
          onAccept={() => handleAcceptRequest(selectedRequest)}
          onReject={() => handleRejectRequest(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.5)',
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  notificationsContainer: {
    // Additional styles if needed
  },
  notificationCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(6,182,212,0.1)',
    padding: 8,
    borderRadius: 24,
    marginRight: 12,
  },
  textContainer: {
    flexShrink: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  senderUsername: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  viewButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
});


