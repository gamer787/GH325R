import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Building2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Profile: { username: string };
};

interface VisibleAd {
  campaign_id: string;
  user_id: string;
  content_id: string;
  distance: number;
  content: {
    id: string;
    type: 'vibe' | 'banger';
    content_url: string;
    caption: string;
    created_at: string;
    user: {
      username: string;
      display_name: string;
      avatar_url: string | null;
      badge?: {
        role: string;
      };
    };
    likes_count: number;
    comments_count: number;
  };
}

interface BrandsProps {
  ads: VisibleAd[];
  likedPosts: Set<string>;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}

export function Brands({ ads, likedPosts, onLike, onComment }: BrandsProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ads.map((ad) => (
        <View key={`ad-${ad.campaign_id}`} style={styles.adContainer}>
          
          {/* Post Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Profile', {
                  username: ad.content.user.username,
                })
              }
            >
              <Image
                source={{
                  uri:
                    ad.content.user.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      ad.content.user.display_name
                    )}&background=random`,
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>

            <View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Profile', {
                    username: ad.content.user.username,
                  })
                }
                style={styles.userInfo}
              >
                <Text style={styles.username}>
                  {ad.content.user.display_name}
                </Text>
                {ad.content.user.badge && (
                  <Text style={styles.badge}>{ad.content.user.badge.role}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.promotedInfo}>
                <Text style={styles.timestamp}>
                  {format(
                    new Date(ad.content?.created_at || new Date()),
                    'MMM d, h:mm a'
                  )}
                </Text>
                <Text style={styles.promotedTag}>Promoted</Text>
              </View>
            </View>
          </View>

          {/* Post Content */}
          {ad.content?.type === 'vibe' ? (
            <Image
              source={{ uri: ad.content?.content_url }}
              style={styles.media}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.videoWrapper}>
              <Video
                source={{ uri: ad.content?.content_url }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                style={styles.media}
              />
            </View>
          )}

          {/* Post Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => ad.content?.id && onLike(ad.content.id)}
              style={styles.actionBtn}
            >
              <Heart
                size={24}
                color={
                  likedPosts.has(ad.content.id) ? '#EC4899' : '#9CA3AF'
                }
              />
              <Text
                style={
                  likedPosts.has(ad.content.id)
                    ? styles.likedText
                    : styles.notLikedText
                }
              >
                {ad.content?.likes_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => ad.content?.id && onComment(ad.content.id)}
              style={styles.actionBtn}
            >
              <MessageCircle size={24} color="#A78BFA" />
              <Text style={styles.commentText}>
                {ad.content?.comments_count || 0}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          {ad.content?.caption && (
            <Text style={styles.caption}>{ad.content.caption}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  adContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    color: '#06B6D4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
  },
  promotedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  promotedTag: {
    color: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
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
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  commentText: {
    color: '#A78BFA',
  },
  caption: {
    color: '#D1D5DB',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
