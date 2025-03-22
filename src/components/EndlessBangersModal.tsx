import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Heart, User } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Banger {
  id: string;
  content_url: string;
  caption: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface EndlessBangersModalProps {
  onClose: () => void;
}

export function EndlessBangersModal({ onClose }: EndlessBangersModalProps) {
  const [bangers, setBangers] = useState<Banger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedBangers, setLikedBangers] = useState<Set<string>>(new Set());
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const lastLoadedPage = useRef(0);
  const hasMoreBangers = useRef(true);

  // Load initial bangers and liked bangers
  useEffect(() => {
    loadBangers();
    loadLikedBangers();
  }, []);

  // Animate slide transition when currentIndex changes
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: -currentIndex * height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, height]);

  async function loadLikedBangers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: likes } = await supabase
        .from('interactions')
        .select('post_id')
        .eq('user_id', user.id)
        .eq('type', 'like');
      setLikedBangers(new Set(likes?.map((like: any) => like.post_id)));
    } catch (error) {
      console.error('Error loading liked bangers:', error);
    }
  }

  async function loadBangers() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const PAGE_SIZE = 10;
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('type', 'banger')
        .order('created_at', { ascending: false })
        .range(lastLoadedPage.current * PAGE_SIZE, (lastLoadedPage.current + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      if (data.length < PAGE_SIZE) {
        hasMoreBangers.current = false;
      }
      setBangers(prev => [...prev, ...data]);
      lastLoadedPage.current += 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bangers');
    } finally {
      setLoading(false);
    }
  }

  const handleLike = async (bangerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (likedBangers.has(bangerId)) {
        // Unlike
        const { error } = await supabase
          .from('interactions')
          .delete()
          .match({
            user_id: user.id,
            post_id: bangerId,
            type: 'like',
          });
        if (error) throw error;
        setLikedBangers(prev => {
          const next = new Set(prev);
          next.delete(bangerId);
          return next;
        });
        setBangers(prev =>
          prev.map(banger =>
            banger.id === bangerId
              ? { ...banger, likes_count: Math.max(0, banger.likes_count - 1) }
              : banger
          )
        );
      } else {
        // Like
        const { error } = await supabase
          .from('interactions')
          .insert({
            user_id: user.id,
            post_id: bangerId,
            type: 'like',
          });
        if (error) throw error;
        setLikedBangers(prev => new Set([...prev, bangerId]));
        setBangers(prev =>
          prev.map(banger =>
            banger.id === bangerId
              ? { ...banger, likes_count: banger.likes_count + 1 }
              : banger
          )
        );
      }
    } catch (err) {
      console.error('Error liking banger:', err);
    }
  };

  // Implement vertical swipe via PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        } else if (gestureState.dy < -50 && currentIndex < bangers.length - 1) {
          setCurrentIndex(prev => prev + 1);
          if (currentIndex >= bangers.length - 3 && !loading && hasMoreBangers.current) {
            loadBangers();
          }
        }
      },
    })
  ).current;

  if (loading && bangers.length === 0) {
    return (
      <Modal visible transparent>
        <View style={styles.loadingBackdrop}>
          <ActivityIndicator size="large" color="#06B6D4" />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.container} {...panResponder.panHandlers}>
          <Animated.View style={[styles.animatedContainer, { transform: [{ translateY }] }]}>
            {bangers.map((banger, index) => (
              <View key={banger.id} style={[styles.bangerContainer, { height }]}>
                <Video
                  source={{ uri: banger.content_url }}
                  style={StyleSheet.absoluteFill}
                  shouldPlay={index === currentIndex}
                  isLooping
                  resizeMode={ResizeMode.CONTAIN}
                  isMuted={index !== currentIndex}
                  useNativeControls={false}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.5)']}
                  style={styles.overlay}
                >
                  {/* User Info */}
                  <View style={styles.userInfo}>
                    <TouchableOpacity onPress={onClose} style={styles.userRow}>
                      <Image
                        source={{
                          uri:
                            banger.user.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              banger.user.display_name
                            )}&background=random`,
                        }}
                        style={styles.avatar}
                      />
                      <Text style={styles.displayName}>{banger.user.display_name}</Text>
                    </TouchableOpacity>
                    {banger.caption ? (
                      <Text style={styles.caption}>{banger.caption}</Text>
                    ) : null}
                  </View>
                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleLike(banger.id)} style={styles.actionButton}>
                      <View
                        style={[
                          styles.likeIconContainer,
                          likedBangers.has(banger.id) && styles.liked,
                        ]}
                      >
                        <Heart size={24} color={likedBangers.has(banger.id) ? '#F472B6' : '#FFFFFF'} />
                      </View>
                      <Text style={styles.actionText}>{banger.likes_count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={styles.actionButton}>
                      <View style={styles.actionIconContainer}>
                        <User size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.actionText}>Profile</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingBackdrop: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  animatedContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  bangerContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 20,
  },
  userInfo: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 80,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  displayName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  actions: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionIconContainer: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  likeIconContainer: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  liked: {
    backgroundColor: 'rgba(244,114,182,0.2)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});

export default EndlessBangersModal;
