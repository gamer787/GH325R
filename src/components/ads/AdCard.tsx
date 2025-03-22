import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, MessageCircle, StopCircle, Eye, MapPin, Clock } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import type { AdCampaign } from '../../types/ads';

// Define your navigation parameter list.
type RootStackParamList = {
  Profile: { username: string };
  // Add other routes here if needed.
};

// Type for the navigation prop for the Profile screen.
type NavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface AdCardProps {
  campaign: AdCampaign;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onStop: (campaignId: string) => void;
  likedPosts: Set<string>;
}

export function AdCard({ campaign, onLike, onComment, onStop, likedPosts }: AdCardProps) {
  const navigation = useNavigation<NavigationProp>();

  // Provide a fallback in case content_url is undefined.
  const contentUrl = campaign.content?.content_url ?? '';
  // Determine if the campaign is liked.
  const isLiked = likedPosts.has(campaign.content?.id ?? campaign.content_id);

  // Destructure user to narrow the type.
  const { user } = campaign;

  return (
    <View style={styles.card}>
      {/* Top Section */}
      <View style={styles.topSection}>
        <View style={styles.profileContainer}>
          <View style={styles.mediaWrapper}>
            {campaign.content?.type === 'vibe' ? (
              <Image
                source={{ uri: contentUrl }}
                style={styles.media}
                resizeMode="cover"
              />
            ) : (
              <Video
                source={{ uri: contentUrl }}
                style={styles.media}
                useNativeControls
                resizeMode={ResizeMode.COVER}
              />
            )}
          </View>

          <View>
            <Text style={styles.campaignText}>
              Campaign #{campaign.id.slice(0, 8)}
            </Text>

            {user ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Profile', { username: user.username })
                }
              >
                <Text style={styles.profileLink}>
                  {user.display_name}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Clock size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>{campaign.duration_hours}h</Text>
              </View>
              <View style={styles.infoItem}>
                <MapPin size={16} color="#9CA3AF" />
                <Text style={styles.infoText}>{campaign.radius_km}km</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.stats}>
            <Eye size={16} color="#06B6D4" />
            <Text style={styles.statsText}>{campaign.views} views</Text>
          </View>
          <Text style={styles.priceText}>₹{campaign.price}</Text>
        </View>
      </View>

      {/* Post Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onLike(campaign.content?.id ?? campaign.content_id)}
          style={styles.actionBtn}
        >
          <Heart size={24} color={isLiked ? '#EC4899' : '#9CA3AF'} />
          <Text style={isLiked ? styles.likedText : styles.actionText}>
            {campaign.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onComment(campaign.content?.id ?? campaign.content_id)}
          style={styles.actionBtn}
        >
          <MessageCircle size={24} color="#9CA3AF" />
          <Text style={styles.actionText}>{campaign.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onStop(campaign.id)}
          style={styles.actionBtn}
        >
          <StopCircle size={24} color="#9CA3AF" />
          <Text style={styles.actionText}>Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progress,
            {
              width: `${Math.min(
                ((new Date().getTime() - new Date(campaign.start_time!).getTime()) /
                  (new Date(campaign.end_time!).getTime() - new Date(campaign.start_time!).getTime())) *
                  100,
                100
              )}%`
            }
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaWrapper: {
    width: 64,
    height: 64,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  campaignText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileLink: {
    color: '#94A3B8',
    marginTop: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#9CA3AF',
    marginLeft: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statsText: {
    color: '#06B6D4',
    marginLeft: 4,
  },
  priceText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#9CA3AF',
  },
  likedText: {
    color: '#EC4899',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 12,
  },
  progress: {
    height: '100%',
    backgroundColor: '#06B6D4',
  },
});
