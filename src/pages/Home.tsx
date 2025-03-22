import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Users } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import Vibes from '../components/home/Vibes';
// Note: Use named import for Bangers because it has no default export.
import { Bangers } from '../components/home/Bangers';
// Ensure the casing matches the actual file name exactly.
import CommentsModal from '../components/commentsModal';
import DeletePostModal from '../components/DeletePostModal';
import EndlessBangersModal from '../components/EndlessBangersModal';
import debounce from 'lodash/debounce';

interface PostsData {
  vibes: any[];
  bangers: any[];
  linkedVibes: any[];
  linkedBangers: any[];
}

export default function Home() {
  // Cast navigation as any to avoid route parameter type errors.
  const navigation = useNavigation<any>();
  const route = useRoute();
  // Assume that a query parameter "view" is passed via route.params
  const { view } = route.params as { view?: string };
  const showBangers = view === 'bangers';

  const [posts, setPosts] = useState<PostsData>({
    vibes: [],
    bangers: [],
    linkedVibes: [],
    linkedBangers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<{ id: string; type: 'vibe' | 'banger' } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showEndlessBangers, setShowEndlessBangers] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Example: load liked posts
  const loadLikedPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: likes } = await supabase
        .from('interactions')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('type', 'like');
      setLikedPosts(new Set(likes?.map((like: any) => like.post_id)));
    } catch (err) {
      console.error('Error loading liked posts:', err);
    }
  };

  // Example: load posts (implementation details omitted)
  const loadPosts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Replace with your RPC call to load posts.
      // For demo, we assume postsData is returned.
      const postsData = {
        vibes: [], // load vibe posts
        bangers: [], // load banger posts
        linkedVibes: [],
        linkedBangers: []
      };
      setPosts(postsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Example: handle like logic
  const handleLike = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (likedPosts.has(postId)) {
        // Unlike
        const { error } = await supabase
          .from('interactions')
          .delete()
          .match({
            user_id: user.id,
            post_id: postId,
            type: 'like'
          });
        if (error) throw error;
        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        // Like
        const { error } = await supabase
          .from('interactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            type: 'like'
          });
        if (error) throw error;
        setLikedPosts(prev => new Set([...prev, postId]));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Example: handle post deletion logic
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete.id);
      if (deleteError) throw deleteError;
      setPosts(prev => ({
        ...prev,
        [postToDelete.type === 'vibe' ? 'vibes' : 'bangers']: prev[
          postToDelete.type === 'vibe' ? 'vibes' : 'bangers'
        ].filter((post: any) => post.id !== postToDelete.id)
      }));
      setPostToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  // Dummy function for updating comment count
  const updateCommentCount = (postId: string, increment: number) => {
    // Update your posts state here
  };

  useEffect(() => {
    loadPosts();
    loadLikedPosts();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Handle double-tap on Bangers icon
  const handleBangersClick = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    if (timeDiff < 300) {
      setShowEndlessBangers(true);
    } else {
      // In native, you might navigate and pass params instead
      // For demonstration, toggle showEndlessBangers false
    }
    setLastClickTime(currentTime);
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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {posts.vibes.length === 0 && posts.bangers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Users size={64} color="#06B6D4" />
          <Text style={styles.emptyTitle}>No Content Yet</Text>
          <Text style={styles.emptySubtitle}>
            Connect with people to see their vibes and bangers here!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('FindUsers')}
            style={styles.findButton}
          >
            <Text style={styles.findButtonText}>Find Connections</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {!showBangers ? (
            <Vibes 
              posts={posts.vibes}
              currentUserId={currentUserId}
              likedPosts={likedPosts}
              onLike={handleLike}
              onComment={(postId: string) => setSelectedPost(postId)}
              onDelete={setPostToDelete}
            />
          ) : (
            <Bangers 
              posts={posts.bangers}
              currentUserId={currentUserId}
              likedPosts={likedPosts}
              onLike={handleLike}
              onComment={(postId: string) => setSelectedPost(postId)}
              onDelete={setPostToDelete}
            />
          )}
        </>
      )}
      {selectedPost && (
        <CommentsModal
          postId={selectedPost}
          onCommentAdded={() => updateCommentCount(selectedPost, 1)}
          onClose={() => setSelectedPost(null)}
        />
      )}
      {postToDelete && (
        <DeletePostModal
          type={postToDelete.type}
          onConfirm={handleDeletePost}
          onCancel={() => setPostToDelete(null)}
        />
      )}
      {showEndlessBangers && (
        <EndlessBangersModal onClose={() => setShowEndlessBangers(false)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginVertical: 8,
    textAlign: 'center',
  },
  findButton: {
    marginTop: 16,
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
});

