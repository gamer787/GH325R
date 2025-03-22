import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Bluetooth,
  Smartphone,
  Search,
  Building2,
  MapPin,
  Globe,
  UserPlus,
  UserMinus,
  Users,
} from 'lucide-react-native';
import debounce from 'lodash/debounce';
import { supabase } from '../lib/supabase';
import { bluetoothScanner, type BluetoothUser } from '../lib/bluetooth';
import { locationDiscovery, type LocationUser } from '../lib/location';
import { nfcScanner } from '../lib/nfc';
import type { NFCUser } from '../lib/nfc';
import { sendFriendRequest } from '../lib/friends';

interface Business {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
  website: string | null;
  bio: string | null;
  industry: string | null;
  followers_count: number;
  badge?: { role: string }[];
}

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'personal' | 'business';
  location: string | null;
  bio: string | null;
  connection_status?: 'pending' | 'accepted' | 'rejected' | 'incoming';
  badge?: { role: string }[];
}

// If your BluetoothUser and LocationUser do not include properties like badge or display_name,
// extend them with a partial User. (Adjust these definitions as needed.)
type ExtendedBluetoothUser = BluetoothUser & Partial<User>;
type ExtendedLocationUser = LocationUser & Partial<User>;

type BusinessFetched = Omit<Business, 'followers_count'>;

// Helper to render icons as JSX
const renderIcon = (IconComponent: React.ComponentType<any>, props: any) => {
  return <IconComponent {...props} />;
};

export default function FindUsers(): React.JSX.Element {
  // Cast navigation as any so that route parameters do not error out.
  const navigation = useNavigation<any>();
  const [isBluetoothScanning, setIsBluetoothScanning] = useState(false);
  const [isNfcScanning, setIsNfcScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'users' | 'businesses'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [followedBusinesses, setFollowedBusinesses] = useState<Set<string>>(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<ExtendedBluetoothUser[]>([]);
  const [undiscoveredUsers, setUndiscoveredUsers] = useState<ExtendedLocationUser[]>([]);
  const [isLocationDiscovering, setIsLocationDiscovering] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get the current user ID once on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // Start scans and discovery on mount, and clean up on unmount
  useEffect(() => {
    startBluetoothScan();
    if (navigator.geolocation) {
      startLocationDiscovery();
    }
    return () => {
      bluetoothScanner.stopScanning();
      nfcScanner.stopScanning();
      locationDiscovery.stopDiscovering();
    };
  }, []);

  const startLocationDiscovery = async () => {
    try {
      setIsLocationDiscovering(true);
      setError(null);
      locationDiscovery.setOnUserDiscovered((user: ExtendedLocationUser) => {
        setUndiscoveredUsers((prev) => {
          if (!prev.some((u) => u.id === user.id)) {
            return [...prev, user];
          }
          return prev.map((u) => (u.id === user.id ? user : u));
        });
      });
      locationDiscovery.setOnError((errorMessage: string) => {
        setError(errorMessage);
      });
      await locationDiscovery.startDiscovering();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start location discovery');
      setIsLocationDiscovering(false);
    }
  };

  const startBluetoothScan = async () => {
    try {
      setError(null);
      bluetoothScanner.setOnUserDiscovered((user: ExtendedBluetoothUser) => {
        setNearbyUsers((prev) => {
          if (!prev.some((u) => u.id === user.id)) {
            return [...prev, user];
          }
          return prev.map((u) => (u.id === user.id ? user : u));
        });
      });
      bluetoothScanner.setOnError((errorMessage: string) => {
        setError(errorMessage);
        setIsBluetoothScanning(false);
      });
      await bluetoothScanner.startScanning(true);
      setIsBluetoothScanning(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start Bluetooth scanning');
      setIsBluetoothScanning(false);
    }
  };

  const stopBluetoothScan = () => {
    bluetoothScanner.stopScanning();
    setIsBluetoothScanning(false);
  };

  const startNfcScan = async () => {
    try {
      setError(null);
      setIsNfcScanning(true);
      nfcScanner.setOnUserDiscovered((user: NFCUser) => {
        handleConnect(user.id, true);
      });
      nfcScanner.setOnError((errorMessage: string) => {
        setError(errorMessage);
        setIsNfcScanning(false);
      });
      await nfcScanner.startScanning();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start NFC scanning');
      setIsNfcScanning(false);
    }
  };

  const stopNfcScan = () => {
    nfcScanner.stopScanning();
    setIsNfcScanning(false);
  };

  const handleConnect = async (userId: string, autoAccept = false) => {
    try {
      setError(null);
      const { error: requestError } = await sendFriendRequest(userId);
      if (requestError) throw requestError;
      setError(autoAccept ? 'Connected successfully via NFC!' : 'Friend request sent successfully!');
      if (searchType === 'users') {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, connection_status: autoAccept ? 'accepted' : 'pending' } : user
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    }
  };

  // Implement follow/unfollow functionality for businesses
  const handleFollow = async (businessId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: businessId });
      if (error) throw error;
      setFollowedBusinesses((prev) => {
        const newSet = new Set(prev);
        newSet.add(businessId);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to follow business');
    }
  };

  const handleUnfollow = async (businessId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', businessId);
      if (error) throw error;
      setFollowedBusinesses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unfollow business');
    }
  };

  const searchUsers = useCallback(
    debounce(async (query: string): Promise<void> => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }
      try {
        setLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select(
            `id, username, display_name, avatar_url, account_type, location, bio, badge:badge_subscriptions!left(role)`
          )
          .eq('account_type', 'personal')
          .neq('id', currentUser.id)
          .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
          .gte('badge_subscriptions.start_date', 'now()')
          .lte('badge_subscriptions.end_date', 'now()')
          .is('badge_subscriptions.cancelled_at', null)
          .order('username', { ascending: true })
          .limit(20);
        if (usersError) throw usersError;
        const { data: requests } = await supabase
          .from('friend_requests')
          .select('*')
          .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.in.(${usersData?.map((u: any) => u.id).join(',')})),and(receiver_id.eq.${currentUser.id},sender_id.in.(${usersData?.map((u: any) => u.id).join(',')}))`
          );
        const usersWithStatus = usersData?.map((user: User) => {
          const outgoingRequest = requests?.find(
            (r: any) => r.sender_id === currentUser.id && r.receiver_id === user.id
          );
          const incomingRequest = requests?.find(
            (r: any) => r.sender_id === user.id && r.receiver_id === currentUser.id
          );
          let status: User['connection_status'];
          if (outgoingRequest) {
            status = outgoingRequest.status;
          } else if (incomingRequest) {
            status = incomingRequest.status === 'pending' ? 'incoming' : incomingRequest.status;
          }
          return { ...user, connection_status: status };
        });
        setUsers(usersWithStatus || []);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setLoading(false);
      }
    }, 300) as (query: string) => void,
    []
  );

  const searchBusinesses = useCallback(
    debounce(async (query: string): Promise<void> => {
      if (!query.trim()) {
        setBusinesses([]);
        return;
      }
      try {
        setLoading(true);
        const { data: businessesData, error: businessError } = await supabase
          .from('profiles')
          .select(
            `id, username, display_name, avatar_url, location, website, bio, industry, badge:badge_subscriptions!left(role)`
          )
          .eq('account_type', 'business')
          .or(
            `display_name.ilike.%${query}%,username.ilike.%${query}%,industry.ilike.%${query}%,location.ilike.%${query}%`
          )
          .gte('badge_subscriptions.start_date', 'now()')
          .lte('badge_subscriptions.end_date', 'now()')
          .is('badge_subscriptions.cancelled_at', null)
          .order('display_name', { ascending: true })
          .limit(20);
        if (businessError) throw businessError;
        const businessesWithCounts = await Promise.all(
          (businessesData || []).map(async (business: BusinessFetched) => {
            const { count } = await supabase
              .from('follows')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', business.id);
            return { ...business, followers_count: count || 0 } as Business;
          })
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: followedData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .in('following_id', businessesWithCounts.map((b: Business) => b.id));
          const followedIds = new Set(followedData?.map((f: any) => f.following_id) || []);
          setFollowedBusinesses(followedIds);
        }
        setBusinesses(businessesWithCounts);
      } catch (err) {
        console.error('Error searching businesses:', err);
      } finally {
        setLoading(false);
      }
    }, 300) as (query: string) => void,
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchType === 'users') {
      searchUsers(text);
    } else {
      searchBusinesses(text);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Discover Nearby</Text>
      <View style={styles.section}>
        {/* Bluetooth Scanning */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardText}>
              {isBluetoothScanning ? 'Scanning for nearby users...' : 'Start scanning to find users nearby'}
            </Text>
            {isBluetoothScanning && (
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={isBluetoothScanning ? stopBluetoothScan : startBluetoothScan}
            style={[
              styles.button,
              isBluetoothScanning ? styles.buttonInactive : styles.buttonActive,
            ]}
          >
            {renderIcon(Bluetooth, { size: 20, color: isBluetoothScanning ? '#9CA3AF' : '#111827' })}
            <Text style={[styles.buttonText, isBluetoothScanning ? styles.buttonTextInactive : styles.buttonTextActive]}>
              {isBluetoothScanning ? 'Stop Scanning' : 'Scan with Bluetooth'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* NFC Scanning */}
        <View style={styles.card}>
          <TouchableOpacity
            onPress={isNfcScanning ? stopNfcScan : startNfcScan}
            style={[
              styles.button,
              isNfcScanning ? styles.buttonInactive : styles.buttonActive,
            ]}
          >
            {renderIcon(Smartphone, { size: 20, color: isNfcScanning ? '#9CA3AF' : '#111827' })}
            <Text style={[styles.buttonText, isNfcScanning ? styles.buttonTextInactive : styles.buttonTextActive]}>
              {isNfcScanning ? 'Stop NFC' : 'Connect with NFC'}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Nearby Users Section */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Nearby Users</Text>
            {isBluetoothScanning && (
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Scanning...</Text>
              </View>
            )}
          </View>
          {nearbyUsers.length > 0 ? (
            <View style={styles.listContainer}>
              {nearbyUsers.map((user: ExtendedBluetoothUser) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.row}>
                      <Image
                        source={{
                          uri:
                            user.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.display_name || ''
                            )}&background=random`,
                        }}
                        style={styles.avatar}
                      />
                      <View style={styles.userInfo}>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: user.username })}>
                          <Text style={styles.userName}>{user.display_name}</Text>
                        </TouchableOpacity>
                        <Text style={styles.userHandle}>@{user.username}</Text>
                        {user.badge &&
                          Array.isArray(user.badge) &&
                          user.badge.length > 0 && (
                            <Text style={styles.badgeText}>{user.badge[0].role}</Text>
                          )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleConnect(user.id)} style={styles.connectButton}>
                      <Text style={styles.connectButtonText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No nearby users discovered</Text>
              <Text style={styles.emptySubText}>
                {isBluetoothScanning ? 'Searching for people around you...' : 'Start scanning to find people around you'}
              </Text>
            </View>
          )}
        </View>
        {/* Undiscovered Nearby Section */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>Undiscovered Nearby</Text>
              <Text style={styles.subTitle}>Within 500 feet</Text>
            </View>
            {isLocationDiscovering && (
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Discovering...</Text>
              </View>
            )}
          </View>
          {undiscoveredUsers.length > 0 ? (
            <View style={styles.listContainer}>
              {undiscoveredUsers.map((user: ExtendedLocationUser) => (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.row}>
                      <Image
                        source={{
                          uri:
                            user.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.display_name || ''
                            )}&background=random`,
                        }}
                        style={styles.avatar}
                      />
                      <View style={styles.userInfo}>
                        <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: user.username })}>
                          <Text style={styles.userName}>{user.display_name}</Text>
                        </TouchableOpacity>
                        <Text style={styles.userHandle}>@{user.username}</Text>
                        {user.badge &&
                          Array.isArray(user.badge) &&
                          user.badge.length > 0 && (
                            <Text style={styles.badgeText}>{user.badge[0].role}</Text>
                          )}
                        <Text style={styles.distanceText}>
                          {Math.round((user as any).distance * 3.28084)} feet away
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleConnect(user.id)} style={styles.connectButton}>
                      <Text style={styles.connectButtonText}>Connect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No undiscovered users nearby</Text>
            </View>
          )}
        </View>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {/* Search Section */}
        <View style={styles.searchContainer}>
          <View style={styles.searchToggleRow}>
            <TouchableOpacity
              onPress={() => {
                setSearchType('users');
                setSearchQuery('');
                setUsers([]);
                setBusinesses([]);
              }}
              style={[
                styles.searchToggleButton,
                searchType === 'users' && styles.searchToggleButtonActive,
              ]}
            >
              {renderIcon(Users, { size: 20, color: searchType === 'users' ? '#111827' : '#9CA3AF' })}
              <Text style={[styles.searchToggleText, searchType === 'users' && { color: '#111827' }]}>
                Find Users
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setSearchType('businesses');
                setSearchQuery('');
                setUsers([]);
                setBusinesses([]);
              }}
              style={[
                styles.searchToggleButton,
                searchType === 'businesses' && styles.searchToggleButtonActive,
              ]}
            >
              {renderIcon(Building2, { size: 20, color: searchType === 'businesses' ? '#111827' : '#9CA3AF' })}
              <Text style={[styles.searchToggleText, searchType === 'businesses' && { color: '#111827' }]}>
                Find Businesses
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchInputContainer}>
            {renderIcon(Search, { size: 20, color: "#9CA3AF", style: { marginLeft: 8 } })}
            <TextInput
              style={styles.searchInput}
              placeholder={
                searchType === 'users'
                  ? "Search users by name or username..."
                  : "Search businesses by name, industry, or location..."
              }
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          </View>
          {loading && (
            <View style={styles.loadingSearchContainer}>
              <ActivityIndicator size="large" color="#06B6D4" />
            </View>
          )}
          {searchType === 'users' && !loading && searchQuery ? (
            users.length > 0 ? (
              <View style={styles.resultsContainer}>
                {users.map((user) => (
                  <View key={user.id} style={styles.resultCard}>
                    <View style={styles.rowBetween}>
                      <View style={styles.row}>
                        <Image
                          source={{
                            uri:
                              user.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user.display_name
                              )}&background=random`,
                          }}
                          style={styles.avatar}
                        />
                        <View style={styles.userInfo}>
                          <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: user.username })}>
                            <Text style={styles.userName}>{user.display_name}</Text>
                          </TouchableOpacity>
                          <Text style={styles.userHandle}>@{user.username}</Text>
                          {user.badge &&
                            Array.isArray(user.badge) &&
                            user.badge.length > 0 && (
                              <Text style={styles.badgeText}>{user.badge[0].role}</Text>
                            )}
                          {user.location && (
                            <View style={styles.row}>
                              {renderIcon(MapPin, { size: 16, color: "#9CA3AF" })}
                              <Text style={styles.locationText}>{user.location}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {user.connection_status ? (
                        <View
                          style={[
                            styles.statusBadge,
                            user.connection_status === 'pending'
                              ? styles.statusBadgePending
                              : user.connection_status === 'accepted'
                              ? styles.statusBadgeAccepted
                              : user.connection_status === 'incoming'
                              ? styles.statusBadgeIncoming
                              : styles.statusBadgeRejected,
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>
                            {user.connection_status === 'incoming'
                              ? 'Incoming Request'
                              : user.connection_status.charAt(0).toUpperCase() +
                                user.connection_status.slice(1)}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => handleConnect(user.id)} style={styles.connectButton}>
                          <Text style={styles.connectButtonText}>Connect</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySearchText}>No users found</Text>
            )
          ) : searchType === 'businesses' && !loading && searchQuery ? (
            businesses.length > 0 ? (
              <View style={styles.resultsContainer}>
                {businesses.map((business) => (
                  <View key={business.id} style={styles.resultCard}>
                    <View style={styles.rowBetween}>
                      <View style={styles.row}>
                        <Image
                          source={{
                            uri:
                              business.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                business.display_name
                              )}&background=random`,
                          }}
                          style={styles.avatar}
                        />
                        <View style={styles.userInfo}>
                          <TouchableOpacity onPress={() => navigation.navigate('Profile', { username: business.username })}>
                            <Text style={[styles.userName, { fontSize: 18 }]}>{business.display_name}</Text>
                          </TouchableOpacity>
                          <Text style={styles.userHandle}>@{business.username}</Text>
                          {business.badge &&
                            Array.isArray(business.badge) &&
                            business.badge.length > 0 && (
                              <Text style={styles.badgeText}>{business.badge[0].role}</Text>
                            )}
                          {business.industry && (
                            <View style={styles.row}>
                              {renderIcon(Building2, { size: 16, color: "#9CA3AF" })}
                              <Text style={styles.locationText}>{business.industry}</Text>
                            </View>
                          )}
                          {business.location && (
                            <View style={styles.row}>
                              {renderIcon(MapPin, { size: 16, color: "#9CA3AF" })}
                              <Text style={styles.locationText}>{business.location}</Text>
                            </View>
                          )}
                          {business.website && (
                            <View style={styles.row}>
                              {renderIcon(Globe, { size: 16, color: "#06B6D4" })}
                              <Text style={[styles.locationText, { color: '#06B6D4' }]}>
                                {business.website}
                              </Text>
                            </View>
                          )}
                          {business.bio && <Text style={styles.bioText}>{business.bio}</Text>}
                          <Text style={styles.followersText}>
                            {business.followers_count} {business.followers_count === 1 ? 'follower' : 'followers'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() =>
                          followedBusinesses.has(business.id)
                            ? handleUnfollow(business.id)
                            : handleFollow(business.id)
                        }
                        style={followedBusinesses.has(business.id) ? styles.unfollowButton : styles.followButton}
                      >
                        {followedBusinesses.has(business.id) ? (
                          <>
                            {renderIcon(UserMinus, { size: 20, color: "#9CA3AF" })}
                            <Text style={styles.unfollowButtonText}>Unfollow</Text>
                          </>
                        ) : (
                          <>
                            {renderIcon(UserPlus, { size: 20, color: "#111827" })}
                            <Text style={styles.followButtonText}>Follow</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySearchText}>No businesses found</Text>
            )
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
    paddingBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: '#06B6D4',
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#06B6D4',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonActive: {
    backgroundColor: '#06B6D4',
  },
  buttonInactive: {
    backgroundColor: '#374151',
  },
  buttonText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#111827',
  },
  buttonTextInactive: {
    color: '#9CA3AF',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    marginTop: 8,
  },
  userCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userHandle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  badgeText: {
    fontSize: 12,
    color: '#06B6D4',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  connectButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  searchContainer: {
    marginTop: 32,
  },
  searchToggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  searchToggleButtonActive: {
    backgroundColor: '#06B6D4',
  },
  searchToggleText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    padding: 8,
    marginLeft: 8,
  },
  loadingSearchContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
  },
  followersText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadgePending: {
    backgroundColor: '#FBBF24',
  },
  statusBadgeAccepted: {
    backgroundColor: '#10B981',
  },
  statusBadgeIncoming: {
    backgroundColor: '#3B82F6',
  },
  statusBadgeRejected: {
    backgroundColor: '#EF4444',
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptySearchText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
  distanceText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  unfollowButton: {
    backgroundColor: '#374151',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  followButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  unfollowButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
