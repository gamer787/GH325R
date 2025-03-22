import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCurrentProfile, updateProfile } from '../lib/auth';
import { getProfileLinks, getProfileBrands, getProfileStats } from '../lib/friends';
import { BusinessProfile } from '../components/profile/BusinessProfile';
import { PersonalProfile } from '../components/profile/PersonalProfile';
import { ProfileStats } from '../components/profile/ProfileStats';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { ConnectionsModal } from '../components/profile/ConnectionsModal';
import { DeletePostModal } from '../components/DeletePostModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { ImageIcon, Film, Trash2 } from 'lucide-react';

// Define ProfileType and alias it as Profile for consistency.
interface ProfileType {
  id: string;
  display_name: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  industry?: string;
  phone?: string;
  account_type: 'business' | 'personal';
  avatar_url?: string | null;
}
type Profile = ProfileType;

// Updated Connection interface – note that avatar_url is now a required property that is either string or null.
interface Connection {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'business' | 'personal';
}

interface Post {
  id: string;
  content_url: string;
  caption: string;
  user_info: any;
}

function Profile() {
  const { username } = useParams<{ username?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'vibes' | 'bangers' | 'links'>('vibes');
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [stats, setStats] = useState({
    vibes_count: 0,
    bangers_count: 0,
    links_count: 0,
    brands_count: 0,
  });
  const [showLinksModal, setShowLinksModal] = useState<boolean>(false);
  const [showBrandsModal, setShowBrandsModal] = useState<boolean>(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [brands, setBrands] = useState<Connection[]>([]);
  const [postToDelete, setPostToDelete] = useState<{ id: string; type: 'vibe' | 'banger' } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [visibleAds, setVisibleAds] = useState<any[]>([]);
  const [activeBadge, setActiveBadge] = useState<{ role: string } | null>(null);
  const [posts, setPosts] = useState<{
    vibes: Post[];
    bangers: Post[];
    linkedVibes: Post[];
    linkedBangers: Post[];
  }>({
    vibes: [],
    bangers: [],
    linkedVibes: [],
    linkedBangers: [],
  });

  // When the username changes, reset editing state and load the profile
  useEffect(() => {
    setIsEditing(false);
    loadProfile().then(() => {
      if (profile) {
        loadStats(profile.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Reload posts and stats when profile or activeTab changes
  useEffect(() => {
    if (profile) {
      loadPosts();
      loadStats(profile.id);
      if (profile.account_type === 'business') {
        loadVisibleAds();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, activeTab]);

  // Fetch profile statistics using an RPC call
  const loadStats = async (profileId: string) => {
    try {
      const { stats: profileStats, error } = await getProfileStats(profileId);
      if (error) throw error;
      if (profileStats) {
        setStats(profileStats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Get current user's ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Load visible ads for business profiles
  const loadVisibleAds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();

      if (!userProfile?.latitude || !userProfile?.longitude) return;

      const { data: ads } = await supabase.rpc('get_visible_ads', {
        viewer_lat: userProfile.latitude,
        viewer_lon: userProfile.longitude,
      });

      if (ads) {
        const { data: fullAds } = await supabase
          .from('ad_campaigns')
          .select(
            `*, content:content_id (
              id,
              type,
              content_url,
              caption
            )`
          )
          .in(
            'id',
            (ads as Array<{ campaign_id: string }>).map(
              (ad: { campaign_id: string }) => ad.campaign_id
            )
          );

        setVisibleAds(fullAds || []);

        await Promise.all(
          (ads as Array<{ campaign_id: string }>).map((ad: { campaign_id: string }) =>
            supabase.rpc('increment_ad_views', {
              campaign_id: ad.campaign_id,
            })
          )
        );
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  // Load profile based on URL parameter or current user
  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let profileId: string | undefined;
      setLoading(true);

      if (username) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();
        profileId = profileData?.id;
      } else {
        profileId = user?.id;
      }

      if (!profileId) {
        navigate('/');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
        const { data: badge } = await supabase.rpc('get_active_badge', { 
          target_user_id: profileId
        });
        setActiveBadge((badge && badge[0]) || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load posts for the current tab using an RPC function
  const loadPosts = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase.rpc('get_profile_posts', {
        profile_id: profile.id,
        post_type: activeTab === 'vibes' ? 'vibe' : 'banger',
      });

      if (postsError) throw postsError;

      const currentTabPosts: Post[] = (postsData as Post[] || []).map((post: Post) => ({
        ...post,
        user_info: post.user_info,
      }));
      setPosts(prev => ({
        ...prev,
        [activeTab === 'vibes' ? 'vibes' : 'bangers']: currentTabPosts,
      }));

      if (activeTab === 'links') {
        const { links } = await getProfileLinks(profile.id);
        if (links && links.length > 0) {
          const linkedUserIds = links.map((link: Connection) => link.id);
          const linkedVibesPromises = linkedUserIds.map((userId: string) =>
            supabase.rpc('get_profile_posts', {
              profile_id: userId,
              post_type: 'vibe',
            })
          );
          const linkedBangersPromises = linkedUserIds.map((userId: string) =>
            supabase.rpc('get_profile_posts', {
              profile_id: userId,
              post_type: 'banger',
            })
          );
          const linkedVibes = await Promise.all(linkedVibesPromises);
          const linkedBangers = await Promise.all(linkedBangersPromises);
          const linkedVibesData: Post[] = linkedVibes
            .flatMap(result => (result.data as Post[] || []))
            .map((post: Post) => ({
              ...post,
              user_info: post.user_info,
            }));
          const linkedBangersData: Post[] = linkedBangers
            .flatMap(result => (result.data as Post[] || []))
            .map((post: Post) => ({
              ...post,
              user_info: post.user_info,
            }));
          setPosts(prev => ({
            ...prev,
            linkedVibes: linkedVibesData,
            linkedBangers: linkedBangersData,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load connections for links or brands
  const loadConnections = async (type: 'links' | 'brands') => {
    if (!profile) return;
    try {
      if (type === 'links') {
        const { links, error } = await getProfileLinks(profile.id);
        if (error) throw error;
        setConnections(
          links
            ? links.map((link: any) => ({
                ...link,
                account_type: link.account_type ?? 'personal',
                avatar_url: link.avatar_url ?? null,
              }))
            : []
        );
      } else {
        const { brands, error } = await getProfileBrands(profile.id);
        if (error) throw error;
        setBrands(
          brands
            ? (Array.isArray(brands[0]) ? brands.flat() : brands).map((brand: any) => ({
                ...brand,
                account_type: brand.account_type ?? 'business',
                avatar_url: brand.avatar_url ?? null,
              }))
            : []
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${type}`);
    }
  };

  // Save profile updates using updateProfile
  const handleSave = async () => {
    if (!profile) return;
    const updates = {
      display_name: profile.display_name,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      industry: profile.industry,
      phone: profile.phone,
    };
    try {
      setError(null);
      const { profile: updatedProfile, error } = await updateProfile(updates);
      if (error) throw error;
      if (updatedProfile) {
        setProfile(updatedProfile as Profile);
      }
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  // Delete a post and update UI and stats accordingly
  const handleDeletePost = async () => {
    if (!postToDelete) return;
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete.id);
      if (deleteError) throw deleteError;
      const { error: storageError } = await supabase.storage
        .from(postToDelete.type === 'vibe' ? 'vibes' : 'bangers')
        .remove([`${currentUserId}/${postToDelete.id}`]);
      if (storageError) {
        console.error('Error deleting file:', storageError);
      }
      setPosts(prev => ({
        ...prev,
        [postToDelete.type === 'vibe' ? 'vibes' : 'bangers']: prev[
          postToDelete.type === 'vibe' ? 'vibes' : 'bangers'
        ].filter((post: Post) => post.id !== postToDelete.id),
      }));
      setStats(prev => {
        const key = (postToDelete.type + 's_count') as keyof typeof prev;
        return { ...prev, [key]: Math.max(0, prev[key] - 1) };
      });
      setPostToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleCancel = () => {
    loadProfile();
    if (profile) {
      loadStats(profile.id);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Profile not found</div>
      </div>
    );
  }

  const isCurrentUser = currentUserId === profile.id;

  // Cast TabsList to any if its props do not support className
  const TabsListAny: React.FC<any> = TabsList as any;

  return (
    <div className="pb-20 max-w-lg mx-auto px-0 sm:px-4">
      <ProfileHeader
        isCurrentUser={isCurrentUser}
        profile={profile}
        isEditing={isEditing}
        onProfileChange={(updates: Partial<ProfileType> & { isEditing?: boolean }) => {
          if (updates.isEditing !== undefined) {
            if (!isCurrentUser) return;
            setIsEditing(updates.isEditing);
          } else {
            setProfile(prev => (prev ? { ...prev, ...updates } : null));
          }
        }}
        onSave={handleSave}
        onCancel={handleCancel}
        setError={setError}
      />

      <div className="mt-20 px-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile(prev => (prev ? { ...prev, display_name: e.target.value } : null))
                  }
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-2xl font-bold"
                />
                <p className="text-gray-400">@{profile.username}</p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                <p className="text-gray-400">@{profile.username}</p>
                {activeBadge && (
                  <div className="mt-2 inline-block bg-cyan-400/10 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium">
                    {activeBadge.role}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {profile.account_type === 'business' ? (
          <BusinessProfile
            profile={profile}
            isEditing={isEditing && isCurrentUser}
            onProfileChange={(updates: Partial<ProfileType>) =>
              setProfile(prev => (prev ? { ...prev, ...updates } : null))
            }
          />
        ) : (
          <PersonalProfile
            profile={profile}
            isEditing={isEditing && isCurrentUser}
            onProfileChange={(updates: Partial<ProfileType>) =>
              setProfile(prev => (prev ? { ...prev, ...updates } : null))
            }
          />
        )}

        <ProfileStats
          profile={profile}
          stats={stats}
          onShowLinks={() => {
            loadConnections('links');
            setShowLinksModal(true);
          }}
          onShowBrands={() => {
            loadConnections('brands');
            setShowBrandsModal(true);
          }}
        />
      </div>

      <Tabs
        defaultValue="vibes"
        value={activeTab}
        onChange={(value: string) =>
          setActiveTab(value as 'vibes' | 'bangers' | 'links')
        }
      >
        <TabsListAny className="flex space-x-1 bg-gray-900 p-1 rounded-none sm:rounded-lg mb-1 sticky top-0 z-10 mx-0 sm:mx-4">
          <TabsTrigger value="vibes">
            <div className="flex-1 flex items-center justify-center space-x-2 transition-colors">
              <ImageIcon className="w-4 h-4" />
              <span>Vibes</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="bangers">
            <div className="flex-1 flex items-center justify-center space-x-2 transition-colors">
              <Film className="w-4 h-4" />
              <span>Bangers</span>
            </div>
          </TabsTrigger>
        </TabsListAny>

        {/* Links Tab Content */}
        <TabsContent value="links">
          {connections.length > 0 ? (
            <div>
              <div className="grid grid-cols-2 gap-4 px-4 mb-8">
                {connections.map((connection: Connection) => (
                  <Link
                    key={connection.id}
                    to={`/profile/${connection.username}`}
                    className="bg-gray-900 p-4 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          connection.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            connection.display_name
                          )}&background=random`
                        }
                        alt={connection.display_name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold">{connection.display_name}</h3>
                        <p className="text-sm text-gray-400">@{connection.username}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-bold px-4 mb-4">Links' Vibes</h2>
                {posts.linkedVibes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5">
                    {posts.linkedVibes.map((post: Post) => (
                      <div key={post.id} className="aspect-square">
                        <img
                          src={post.content_url}
                          alt={post.caption}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400 bg-gray-900 mx-4 rounded-lg">
                    <p>No vibes from links yet</p>
                  </div>
                )}

                <h2 className="text-xl font-bold px-4 mb-4 mt-8">Links' Bangers</h2>
                {posts.linkedBangers.length > 0 ? (
                  <div className="grid grid-cols-3 gap-0.5">
                    {posts.linkedBangers.map((post: Post) => (
                      <div key={post.id} className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                        <video
                          src={post.content_url}
                          controls
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400 bg-gray-900 mx-4 rounded-lg">
                    <p>No bangers from links yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-400 bg-gray-900 mx-4 rounded-lg">
              <p>No links yet</p>
            </div>
          )}
        </TabsContent>

        {/* Vibes Tab Content */}
        <TabsContent value="vibes">
          {posts.vibes.length > 0 ? (
            <div className="grid grid-cols-3 gap-[2px]">
              {posts.vibes.map((post: Post) => (
                <div key={post.id} className="aspect-square relative group">
                  <img
                    src={post.content_url}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                  {isCurrentUser && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => setPostToDelete({ id: post.id, type: 'vibe' })}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-400 bg-gray-900 mx-4 rounded-lg">
              <p>No vibes posted yet</p>
            </div>
          )}
        </TabsContent>

        {/* Bangers Tab Content */}
        <TabsContent value="bangers">
          {posts.bangers.length > 0 ? (
            <div className="grid grid-cols-3 gap-[2px]">
              {posts.bangers.map((post: Post) => (
                <div key={post.id} className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden group">
                  <video
                    src={post.content_url}
                    controls
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {isCurrentUser && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => setPostToDelete({ id: post.id, type: 'banger' })}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-400 bg-gray-900 mx-4 rounded-lg">
              <p>No bangers posted yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showLinksModal && (
        <ConnectionsModal
          type="links"
          profile={profile}
          items={connections}
          onClose={() => setShowLinksModal(false)}
          onUnfollow={async (userId: string) => {
            try {
              const { error } = await supabase
                .from('follows')
                .delete()
                .match({ follower_id: profile.id, following_id: userId });
              if (error) throw error;
              await loadConnections('links');
              await loadProfile();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to unfollow user');
            }
          }}
        />
      )}

      {showBrandsModal && (
        <ConnectionsModal
          type="brands"
          profile={profile}
          items={brands}
          onClose={() => setShowBrandsModal(false)}
          onUnfollow={async (userId: string) => {
            try {
              const { error } = await supabase
                .from('follows')
                .delete()
                .match({ follower_id: profile.id, following_id: userId });
              if (error) throw error;
              await loadConnections('brands');
              await loadProfile();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to unfollow business');
            }
          }}
        />
      )}

      {postToDelete && (
        <DeletePostModal
          type={postToDelete.type}
          onConfirm={handleDeletePost}
          onCancel={() => setPostToDelete(null)}
        />
      )}
    </div>
  );
}

export default Profile;
