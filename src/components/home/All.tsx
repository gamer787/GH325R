import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Profile: { username: string };
  // add other screens if needed
};

interface Post {
  id: string;
  type: 'vibe' | 'banger';
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

interface AllProps {
  posts: Post[];
  currentUserId: string | null;
  likedPosts: Set<string>;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onDelete: (post: { id: string; type: 'vibe' | 'banger' }) => void;
}

export function All({ posts, currentUserId, likedPosts, onLike, onComment, onDelete }: AllProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {posts.map((post) => (
        <View key={`post-${post.id}`} style={styles.postContainer}>
          
          {/* Post Content */}
          {post.type === 'vibe' ? (
            <Image
              source={{ uri: post.content_url }}
              style={styles.media}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoWrapper}>
              <Video
                source={{ uri: post.content_url }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                style={styles.media}
              />
            </View>
          )}

          {/* User Info and Actions */}
          <View style={styles.content}>
            <View style={styles.header}>
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
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user.display_name)}&background=random`,
                  }}
                  style={styles.avatar}
                />
                <View>
                  <View style={styles.userNameBadge}>
                    <Text style={styles.userName}>{post.user.display_name}</Text>
                    {post.user.badge && (
                      <Text style={styles.badge}>{post.user.badge.role}</Text>
                    )}
                  </View>
                  <Text style={styles.timestamp}>
                    {format(new Date(post.created_at), 'MMM d, h:mm a')}
                  </Text>
                </View>
              </TouchableOpacity>

              {currentUserId === post.user.id && (
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', onPress: () => onDelete({ id: post.id, type: post.type }) },
                    ]);
                  }}
                  style={styles.deleteBtn}
                >
                  <Trash2 size={20} color="#F87171" />
                </TouchableOpacity>
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
                style={styles.actionBtn}
              >
                <Heart
                  size={24}
                  color={likedPosts.has(post.id) ? "#EC4899" : "#9CA3AF"}
                />
                <Text style={likedPosts.has(post.id) ? styles.likedText : styles.notLikedText}>
                  {post.likes_count}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onComment(post.id)}
                style={styles.commentBtn}
              >
                <MessageCircle size={24} color="#A78BFA" />
                <Text style={styles.commentText}>{post.comments_count}</Text>
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
    padding: 16,
  },
  postContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  media: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#000000',
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    color: '#06B6D4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    fontSize: 12,
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 24,
  },
  caption: {
    color: '#D1D5DB',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likedText: {
    color: '#EC4899',
  },
  notLikedText: {
    color: '#9CA3AF',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentText: {
    color: '#A78BFA',
  },
});
