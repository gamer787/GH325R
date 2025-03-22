import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  BadgeCheck,
  Zap,
  Users,
  Globe,
  Sparkles,
  Shield,
  Rocket,
  Target,
  Palette,
  CheckCircle,
  Code,
  Stethoscope,
  Wallet,
  GraduationCap,
  Film,
  Wrench,
  Scale,
  Music,
  Building2, // add Building2 here if available; otherwise, replace it with another icon.
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { handleBadgePayment } from '../lib/payments';

interface BadgeCategory {
  name: string;
  roles: string[];
  color: string; // e.g., 'from-yellow-400 to-amber-400'
}

const BADGE_CATEGORIES: BadgeCategory[] = [
  { name: 'VIP', roles: ['VIP'], color: 'from-yellow-400 to-amber-400' },
  {
    name: 'Tech & Geeky',
    roles: ['CodeWizard', 'CyberNinja', 'PixelPioneer', 'AI Overlord', 'QuantumQuirk'],
    color: 'from-emerald-400 to-cyan-400',
  },
  {
    name: 'Adventure & Travel',
    roles: ['NomadSoul', 'WildWanderer', 'TrailblazerX', 'SkyRider', 'OceanDrifter'],
    color: 'from-blue-400 to-green-400',
  },
  {
    name: 'Foodie & Fun',
    roles: ['SnackMaster', 'CaffeineQueen', 'SpicyMango', 'SugarRush', 'MidnightMuncher'],
    color: 'from-orange-400 to-red-400',
  },
  {
    name: 'Fashion & Aesthetic',
    roles: ['ChicVibes', 'StreetStyleKing', 'RetroFlare', 'GlamStorm', 'DripGod'],
    color: 'from-pink-400 to-purple-400',
  },
  {
    name: 'Music & Arts',
    roles: ['MelodyMaverick', 'BeatJunkie', 'InkSlinger', 'SynthSorcerer', 'CanvasDreamer'],
    color: 'from-violet-400 to-indigo-400',
  },
  {
    name: 'Mysterious & Cool',
    roles: ['ShadowStriker', 'LunarPhantom', 'MidnightEcho', 'FrostByte', 'SilentStorm'],
    color: 'from-gray-400 to-slate-400',
  },
  {
    name: 'Business & Corporate',
    roles: ['CEO', 'CFO', 'COO', 'CMO', 'HR Manager', 'Business Analyst'],
    color: 'from-blue-400 to-cyan-400',
  },
  {
    name: 'Technology & IT',
    roles: ['Software Engineer', 'Data Scientist', 'Cybersecurity Analyst', 'DevOps Engineer', 'UI/UX Designer', 'AI/ML Engineer'],
    color: 'from-purple-400 to-pink-400',
  },
  {
    name: 'Healthcare',
    roles: ['Doctor', 'Nurse', 'Pharmacist', 'Medical Researcher', 'Radiologist', 'Physiotherapist'],
    color: 'from-red-400 to-pink-400',
  },
  {
    name: 'Finance & Banking',
    roles: ['Investment Banker', 'Financial Analyst', 'Risk Manager', 'Accountant', 'Wealth Manager', 'Loan Officer'],
    color: 'from-green-400 to-emerald-400',
  },
  {
    name: 'Education',
    roles: ['Teacher', 'Professor', 'Principal', 'Academic Counselor', 'Educational Technologist', 'Curriculum Developer'],
    color: 'from-yellow-400 to-orange-400',
  },
  {
    name: 'Marketing & Advertising',
    roles: ['Digital Marketer', 'SEO Specialist', 'Content Strategist', 'Brand Manager', 'Social Media Manager', 'Public Relations Specialist'],
    color: 'from-pink-400 to-rose-400',
  },
  {
    name: 'Media & Entertainment',
    roles: ['Journalist', 'Film Director', 'Scriptwriter', 'Video Editor', 'Music Producer', 'Actor'],
    color: 'from-indigo-400 to-purple-400',
  },
  {
    name: 'Manufacturing & Engineering',
    roles: ['Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Quality Control Specialist', 'Production Manager', 'Industrial Designer'],
    color: 'from-orange-400 to-amber-400',
  },
  {
    name: 'Legal',
    roles: ['Lawyer', 'Judge', 'Paralegal', 'Legal Consultant', 'Corporate Counsel', 'Compliance Officer'],
    color: 'from-slate-400 to-gray-400',
  },
  {
    name: 'Music & Creative Arts',
    roles: ['Singer', 'Musician', 'Songwriter', 'Composer', 'Music Producer', 'Sound Engineer', 'DJ', 'Music Director', 'Talent Manager'],
    color: 'from-violet-400 to-fuchsia-400',
  },
  {
    name: 'Miscellaneous',
    roles: [
      'MemeKing',
      'TrendSetter',
      'VibeMaster',
      'PartyStarter',
      'DreamWeaver',
      'StarChild',
      'CosmicExplorer',
      'ZenMaster',
      'LegendaryBeing',
    ],
    color: 'from-teal-400 to-cyan-400',
  },
];

export default function BadgeSelection() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeBadge, setActiveBadge] = useState<{
    category: string;
    role: string;
    days_remaining: number;
    subscription_id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load profile and active badge on mount
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [profileRes, badgeRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id),
          supabase.rpc('get_active_badge', { target_user_id: user.id }),
        ]);
        if (profileRes.data && profileRes.data[0]) {
          setProfile(profileRes.data[0]);
        }
        if (badgeRes.data && badgeRes.data[0]) {
          setActiveBadge(badgeRes.data[0]);
        }
      }
    };
    loadProfile();
  }, []);

  const handlePurchase = async () => {
    if (!selectedRole || !selectedCategory) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('Not authenticated');

      const [profileRes, activeBadgeRes] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('id', user.id),
        supabase.rpc('get_active_badge', { target_user_id: user.id }),
      ]);
      if (!profileRes.data) throw new Error('Profile not found');
      if (activeBadgeRes.data && activeBadgeRes.data[0]) throw new Error('You already have an active badge');

      const price = selectedCategory.name === 'VIP' ? 297 : 99;
      
      const { success, error, subscription } = await handleBadgePayment(
        {
          category: selectedCategory.name,
          role: selectedRole,
          price: price,
        },
        {
          name: profile.display_name,
          email: user.email || '',
        }
      );

      if (!success || error) throw error;
      
      setSuccess('Payment successful! Your badge is now active.');
      
      const { data: newBadge } = await supabase.rpc('get_active_badge', { target_user_id: user.id });
      
      if (newBadge && newBadge[0]) {
        setActiveBadge(newBadge[0]);
      }
      
      setSelectedCategory(null);
      setSelectedRole(null);
      
      navigation.navigate('Hub' as never);
    } catch (err) {
      console.error('Error purchasing badge:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate badge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Hub' as never)} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Badge</Text>
      </View>

      {/* Active Badge Section */}
      {activeBadge && (
        <View style={styles.activeBadgeContainer}>
          <View style={styles.activeBadgeContent}>
            <View style={styles.activeBadgeRow}>
              <View style={styles.activeBadgeAvatarContainer}>
                <Image
                  source={{ uri: activeBadge.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeBadge.display_name)}&background=random` }}
                  style={styles.activeBadgeAvatar}
                />
              </View>
              <View style={styles.activeBadgeInfo}>
                <Text style={styles.activeBadgeDisplayName}>{activeBadge.display_name}</Text>
                <Text style={styles.activeBadgeUsername}>@{activeBadge.username}</Text>
                <View style={styles.activeBadgeRoleContainer}>
                  <Text style={styles.activeBadgeRoleText}>{activeBadge.role}</Text>
                </View>
                <Text style={styles.activeBadgeCategoryText}>Category: {activeBadge.category}</Text>
              </View>
              <View style={styles.badgeDaysContainer}>
                <Text style={styles.badgeDays}>{activeBadge.days_remaining} days</Text>
                <Text style={styles.badgeDaysLabel}>remaining</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handlePurchase} disabled={loading || !!activeBadge} style={[styles.purchaseButton, activeBadge ? styles.purchaseButtonDisabled : {}]}>
              {loading ? (
                <Text style={styles.purchaseButtonText}>Processing...</Text>
              ) : activeBadge ? (
                <Text style={styles.purchaseButtonText}>You already have an active badge</Text>
              ) : (
                <Text style={styles.purchaseButtonText}>
                  Activate Badge for ₹{selectedCategory?.name === 'VIP' ? '297' : '99'}/month
                </Text>
              )}
            </TouchableOpacity>
            {activeBadge && (
              <Text style={styles.badgeNote}>
                You can purchase a new badge after your current badge expires
              </Text>
            )}
            {error && (
              <View style={styles.messageContainerError}>
                <Text style={styles.messageText}>{error}</Text>
              </View>
            )}
            {success && (
              <View style={styles.messageContainerSuccess}>
                <Text style={styles.messageText}>{success}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Categories & Roles */}
      <View style={styles.mainContent}>
        {/* Categories Grid */}
        <View style={styles.categoriesGrid}>
          {BADGE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.name}
              onPress={() => {
                setSelectedCategory(category);
                setSelectedRole(null);
              }}
              style={[
                styles.categoryButton,
                selectedCategory?.name === category.name
                  ? [styles.categorySelected, { backgroundColor: category.color.split(' ')[1] }]
                  : styles.categoryUnselected,
              ]}
            >
              <View style={[
                styles.categoryIconContainer,
                selectedCategory?.name === category.name ? styles.categoryIconSelected : styles.categoryIconUnselected,
              ]}>
                {/* Render icon based on category name */}
                {category.name === 'Business & Corporate' && <Building2 size={24} color="#FFFFFF" />}
                {category.name === 'Technology & IT' && <Code size={24} color="#FFFFFF" />}
                {category.name === 'Healthcare' && <Stethoscope size={24} color="#FFFFFF" />}
                {category.name === 'Finance & Banking' && <Wallet size={24} color="#FFFFFF" />}
                {category.name === 'Education' && <GraduationCap size={24} color="#FFFFFF" />}
                {category.name === 'Marketing & Advertising' && <Target size={24} color="#FFFFFF" />}
                {category.name === 'Media & Entertainment' && <Film size={24} color="#FFFFFF" />}
                {category.name === 'Manufacturing & Engineering' && <Wrench size={24} color="#FFFFFF" />}
                {category.name === 'Legal' && <Scale size={24} color="#FFFFFF" />}
                {category.name === 'Music & Creative Arts' && <Music size={24} color="#FFFFFF" />}
                {!(category.name in {
                  'Business & Corporate': 1,
                  'Technology & IT': 1,
                  'Healthcare': 1,
                  'Finance & Banking': 1,
                  'Education': 1,
                  'Marketing & Advertising': 1,
                  'Media & Entertainment': 1,
                  'Manufacturing & Engineering': 1,
                  'Legal': 1,
                  'Music & Creative Arts': 1,
                }) && <BadgeCheck size={24} color="#FFFFFF" />}
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryRolesCount}>{category.roles.length} roles</Text>
              {selectedCategory?.name === category.name && (
                <View style={styles.categorySelectedIndicator}>
                  <Text style={styles.categorySelectedText}>Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Roles and Preview Section */}
        {selectedCategory && (
          <View style={styles.rolesSection}>
            <View style={styles.rolesContainer}>
              <Text style={styles.rolesTitle}>Choose Your Role in {selectedCategory.name}</Text>
              <View style={styles.rolesGrid}>
                {selectedCategory.roles.map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    style={[
                      styles.roleButton,
                      selectedRole === role
                        ? [styles.roleSelected, { backgroundColor: selectedCategory.color.split(' ')[1] }]
                        : styles.roleUnselected,
                    ]}
                  >
                    <Text style={styles.roleText}>{role}</Text>
                    {selectedRole === role && (
                      <CheckCircle size={16} color="#FFFFFF" style={styles.roleCheckIcon} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Badge Preview */}
            {selectedRole && profile && (
              <View style={styles.badgePreviewContainer}>
                <Text style={styles.previewTitle}>Badge Preview</Text>
                <View style={styles.badgePreview}>
                  <View style={[styles.badgeAvatarWrapper, { borderColor: selectedCategory.color.split(' ')[1] }]}>
                    <Image
                      source={{
                        uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name)}&background=random`,
                      }}
                      style={styles.previewBadgeAvatar}
                    />
                  </View>
                  <View style={styles.badgeTextContainer}>
                    <Text style={styles.previewBadgeDisplayName}>{profile.display_name}</Text>
                    <View style={[styles.badgeRoleBadge, { backgroundColor: selectedCategory.color.split(' ')[1] }]}>
                      <Text style={styles.previewBadgeRoleText}>{selectedRole}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={loading || !!activeBadge}
                  style={[styles.purchaseButton, activeBadge ? styles.purchaseButtonDisabled : {}]}
                >
                  {loading ? (
                    <Text style={styles.purchaseButtonText}>Processing...</Text>
                  ) : activeBadge ? (
                    <Text style={styles.purchaseButtonText}>You already have an active badge</Text>
                  ) : (
                    <Text style={styles.purchaseButtonText}>
                      Activate Badge for ₹{selectedCategory.name === 'VIP' ? '297' : '99'}/month
                    </Text>
                  )}
                </TouchableOpacity>
                {activeBadge && (
                  <Text style={styles.badgeNote}>
                    You can purchase a new badge after your current badge expires
                  </Text>
                )}
                {error && (
                  <View style={styles.messageContainerError}>
                    <Text style={styles.messageText}>{error}</Text>
                  </View>
                )}
                {success && (
                  <View style={styles.messageContainerSuccess}>
                    <Text style={styles.messageText}>{success}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {!selectedCategory && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Select a category to view available roles</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  // Active badge section styles
  activeBadgeContainer: {
    backgroundColor: 'rgba(6,182,212,0.2)',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
    marginBottom: 24,
  },
  activeBadgeContent: {
    flexDirection: 'column',
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeBadgeAvatarContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  activeBadgeAvatar: {
    width: 48,
    height: 48,
  },
  activeBadgeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activeBadgeDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06B6D4',
  },
  activeBadgeUsername: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activeBadgeRoleContainer: {
    marginTop: 4,
  },
  activeBadgeRoleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  activeBadgeCategoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  badgeDaysContainer: {
    alignItems: 'flex-end',
  },
  badgeDays: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  badgeDaysLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Purchase button (only one occurrence now)
  purchaseButton: {
    marginTop: 16,
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  badgeNote: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  messageContainerError: {
    marginTop: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  messageContainerSuccess: {
    marginTop: 12,
    backgroundColor: 'rgba(16,185,129,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Main content & grid styles
  mainContent: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryButton: {
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  categorySelected: {
    // backgroundColor is set dynamically
  },
  categoryUnselected: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryIconUnselected: {
    backgroundColor: 'rgba(31,41,55,0.5)',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  categoryRolesCount: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
  categorySelectedIndicator: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categorySelectedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  // Roles section styles
  rolesSection: {
    marginBottom: 24,
  },
  rolesContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  rolesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roleButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleSelected: {
    // backgroundColor is set dynamically
  },
  roleUnselected: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  roleText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  roleCheckIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  // Badge preview styles (renamed to avoid conflict)
  badgePreviewContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgePreview: {
    backgroundColor: 'rgba(31,41,55,0.8)',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeAvatarWrapper: {
    borderWidth: 4,
    borderRadius: 40,
    overflow: 'hidden',
  },
  previewBadgeAvatar: {
    width: 80,
    height: 80,
  },
  badgeTextContainer: {
    marginLeft: 16,
  },
  previewBadgeDisplayName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgeRoleBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  previewBadgeRoleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  // Placeholder style
  placeholderContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});

