import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Trash2, Volume2, VolumeX } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type RootStackParamList = {
  Profile: { username: string };
  // other screens can be added here
};

interface Post {
  id: string;
  type: 'banger';
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

interface BangersProps {
  posts: Post[];
  currentUserId: string | null;
  likedPosts: Set<string>;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onDelete: (post: { id: string; type: 'banger' }) => void;
}

export function Bangers({ posts, currentUserId, likedPosts, onLike, onComment, onDelete }: BangersProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(Video | null)[]>([]);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Auto-pause logic: play the current video and pause the rest.
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.playAsync().catch(() => {});
        } else {
          video.pauseAsync();
        }
      }
    });
  }, [currentIndex]);

  // Handle scrolling to update the current index.
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const newIndex = Math.round(scrollPosition / SCREEN_HEIGHT);
    setCurrentIndex(newIndex);
  };

  return (
    <ScrollView
      pagingEnabled
      onScroll={handleScroll}
      scrollEventThrottle={16}
      style={styles.container}
    >
      {posts.map((post, index) => (
        <View key={post.id} style={styles.postContainer}>
          <Video
            ref={(el) => (videoRefs.current[index] = el)}
            source={{ uri: post.content_url }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            style={styles.media}
            isMuted={isMuted}
            shouldPlay={index === currentIndex}
            isLooping
          />

          {/* Overlay Content */}
          <View style={styles.overlay}>
            {/* User Info */}
            <View style={styles.userInfo}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Profile', { username: post.user.username })
                }
                style={styles.userDetails}
              >
                <Image
                  source={{
                    uri: post.user.avatar_url || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user.display_name)}&background=random`
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
              {post.user.badge && (
                <Text style={styles.badge}>{post.user.badge.role}</Text>
              )}
            </View>

            {/* Caption */}
            {post.caption && (
              <Text style={styles.caption}>{post.caption}</Text>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => onLike(post.id)}
                style={styles.actionButton}
              >
                <Heart size={24} color={likedPosts.has(post.id) ? '#EC4899' : '#9CA3AF'} />
                <Text style={likedPosts.has(post.id) ? styles.likedText : styles.notLikedText}>
                  {post.likes_count}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onComment(post.id)}
                style={styles.actionButton}
              >
                <MessageCircle size={24} color="#A78BFA" />
                <Text style={styles.commentText}>{post.comments_count}</Text>
              </TouchableOpacity>

              {currentUserId === post.user.id && (
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert('Delete Post', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', onPress: () => onDelete({ id: post.id, type: 'banger' }) }
                    ])
                  }
                  style={styles.actionButton}
                >
                  <Trash2 size={24} color="#EF4444" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setIsMuted(!isMuted)}
                style={styles.actionButton}
              >
                {isMuted ? (
                  <VolumeX size={24} color="#FFFFFF" />
                ) : (
                  <Volume2 size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
  },
  postContainer: {
    height: SCREEN_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    // If needed, add margin or padding instead of gap.
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  username: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#06B6D4',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    fontSize: 12,
  },
  caption: {
    color: '#D1D5DB',
    marginBottom: 8,
  },
  actions: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
});
