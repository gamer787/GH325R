import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Heart, MessageCircle, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type RootStackParamList = {
  Profile: { username: string };
};

interface Post {
  id: string;
  type: 'vibe';
  content_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    badge?: {
      role: string;
    };
  };
}

interface VibesProps {
  posts: Post[];
  currentUserId: string | null;
  likedPosts: Set<string>;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onDelete: (post: { id: string; type: 'vibe' }) => void;
  isProfileView?: boolean;
}

export function Vibes({
  posts,
  currentUserId,
  likedPosts,
  onLike,
  onComment,
  onDelete,
  isProfileView = false,
}: VibesProps) {
  // Type the navigation hook so that 'Profile' accepts a { username: string } parameter.
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartY = useRef<number | null>(null);

  // Scroll logic for mobile swipe gestures
  const handleTouchStart = (e: any) => {
    touchStartY.current = e.nativeEvent.locationY;
  };

  const handleTouchMove = (e: any) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.nativeEvent.locationY;
    const deltaY = touchEndY - touchStartY.current;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (deltaY < 0 && currentIndex < posts.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  // Grid Layout for Profile View
  if (isProfileView) {
    return (
      <ScrollView contentContainerStyle={styles.grid}>
        {posts.map((post) => (
          <View key={post.id} style={styles.gridItem}>
            <Image source={{ uri: post.content_url }} style={styles.gridImage} />
            {currentUserId === post.user.id && (
              <TouchableOpacity
                onPress={() => onDelete({ id: post.id, type: 'vibe' })}
                style={styles.deleteOverlay}
              >
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    );
  }

  // Feed View
  return posts.length === 0 ? (
    <View style={styles.emptyMessage}>
      <Text style={styles.emptyText}>No vibes to show</Text>
    </View>
  ) : (
    <ScrollView
      pagingEnabled
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      contentContainerStyle={styles.scrollContainer}
    >
      {posts.map((post, index) => (
        <View key={post.id} style={styles.postContainer}>
          <Image source={{ uri: post.content_url }} style={styles.media} />
          {/* Overlay Info */}
          <View style={styles.overlay}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Profile', { username: post.user.username })
              }
              style={styles.userInfo}
            >
              <Image
                source={{
                  uri:
                    post.user.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      post.user.display_name
                    )}&background=random`,
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.username}>{post.user.display_name}</Text>
                <Text style={styles.timestamp}>
                  {format(new Date(post.created_at), 'MMM d, h:mm a')}
                </Text>
              </View>
            </TouchableOpacity>
            {/* Caption */}
            {post.caption && <Text style={styles.caption}>{post.caption}</Text>}
            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => onLike(post.id)} style={styles.actionBtn}>
                <Heart
                  size={24}
                  color={likedPosts.has(post.id) ? '#EC4899' : '#9CA3AF'}
                />
                <Text style={likedPosts.has(post.id) ? styles.likedText : styles.notLikedText}>
                  {post.likes_count}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onComment(post.id)} style={styles.actionBtn}>
                <MessageCircle size={24} color="#A78BFA" />
                <Text style={styles.commentText}>{post.comments_count}</Text>
              </TouchableOpacity>
              {currentUserId === post.user.id && (
                <TouchableOpacity onPress={() => onDelete({ id: post.id, type: 'vibe' })} style={styles.actionBtn}>
                  <Trash2 size={24} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: '32%',
    aspectRatio: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  deleteOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    padding: 6,
    borderRadius: 20,
  },
  postContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  username: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  caption: {
    color: '#D1D5DB',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedText: {
    color: '#EC4899',
    marginLeft: 4,
  },
  notLikedText: {
    color: '#9CA3AF',
    marginLeft: 4,
  },
  commentText: {
    color: '#A78BFA',
    marginLeft: 4,
  },
  emptyMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default Vibes;
