import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  comment_text: string;
  created_at: string;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface CommentsModalProps {
  postId: string;
  onCommentAdded?: () => void;
  onClose: () => void;
}

export function CommentsModal({ postId, onCommentAdded, onClose }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load comments and subscribe to new comment events
  useEffect(() => {
    loadComments();
    // Focus the input field shortly after modal opens
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    const subscription = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interactions',
          filter: `post_id=eq.${postId}`,
        },
        handleNewComment
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId]);

  // Scroll to bottom when comments update
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [comments]);

  const handleNewComment = (payload: any) => {
    if (payload.new.type === 'comment') {
      loadComments();
    }
  };

  async function loadComments() {
    try {
      setLoading(true);
      const { data, error: commentsError } = await supabase
        .from('interactions')
        .select(`
          *,
          user:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('type', 'comment')
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('interactions')
        .insert({
          user_id: user.id,
          post_id: postId,
          type: 'comment',
          comment_text: newComment.trim(),
        });

      if (error) throw error;
      onCommentAdded?.();
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Comments</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {/* Comments List */}
              <ScrollView style={styles.commentsContainer} ref={scrollViewRef} contentContainerStyle={styles.commentsContent}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#06B6D4" />
                  </View>
                ) : comments.length === 0 ? (
                  <View style={styles.noCommentsContainer}>
                    <Text style={styles.noCommentsText}>No comments yet</Text>
                    <Text style={styles.noCommentsSubText}>Be the first to comment!</Text>
                  </View>
                ) : (
                  comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <TouchableOpacity>
                        <Image
                          source={{ uri: comment.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.display_name)}&background=random` }}
                          style={styles.avatar}
                        />
                      </TouchableOpacity>
                      <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                          <TouchableOpacity>
                            <Text style={styles.commentAuthor}>{comment.user.display_name}</Text>
                          </TouchableOpacity>
                          <Text style={styles.commentDate}>
                            {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                          </Text>
                        </View>
                        <Text style={styles.commentText}>{comment.comment_text}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
              {/* Comment Input */}
              <View style={styles.inputContainer}>
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                <View style={styles.inputRow}>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholder="Add a comment..."
                    placeholderTextColor="#9CA3AF"
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!newComment.trim()}
                    style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                  >
                    <Send size={20} color="#111827" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#111827',
    width: '100%',
    maxWidth: 480,
    maxHeight: 600,
    height: '85%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  commentsContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  noCommentsSubText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  commentDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentText: {
    color: '#E5E7EB',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderColor: '#1F2937',
    backgroundColor: '#111827',
    padding: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#06B6D4',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

export default CommentsModal;
