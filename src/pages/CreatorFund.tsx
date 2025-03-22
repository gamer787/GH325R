import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft,
  DollarSign,
  Users,
  Film,
  ImageIcon,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface EligibilityStatus {
  linksCount: number;
  bangersCount: number;
  vibesCount: number;
  brandsCount: number;
  accountAge: number;
  isActive: boolean;
}

export default function CreatorFund(): React.JSX.Element {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityStatus>({
    linksCount: 0,
    bangersCount: 0,
    vibesCount: 0,
    brandsCount: 0,
    accountAge: 0,
    isActive: false,
  });

  useEffect(() => {
    loadEligibility();
  }, []);

  const loadEligibility = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { data: profile },
        { count: bangersCount },
        { count: vibesCount },
        { data: brands },
      ] = await Promise.all([
        supabase.from('profiles').select('created_at').eq('id', user.id).single(),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'banger'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'vibe'),
        supabase
          .from('follows')
          .select('following_id, profiles!follows_following_id_fkey(account_type)')
          .eq('follower_id', user.id)
          .eq('profiles.account_type', 'business'),
      ]);
      if (!profile) return;
      const accountAge = Math.floor(
        (new Date().getTime() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const { data: links } = await supabase.rpc('get_profile_links', {
        profile_id: user.id,
        include_badges: false,
      });

      // Updated: access the first element of the profiles array
      const businessBrands = (brands || []).filter(
        (b: any) => Array.isArray(b.profiles) && b.profiles[0]?.account_type === 'business'
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      setEligibility({
        linksCount: links?.length || 0,
        bangersCount: Number(bangersCount) || 0,
        vibesCount: Number(vibesCount) || 0,
        brandsCount: businessBrands.length || 0,
        accountAge,
        isActive: (activeCount || 0) > 0,
      });
    } catch (error) {
      console.error('Error loading eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRequirementStatus = (current: number, required: number) => {
    const percentage = Math.min((current / required) * 100, 100);
    return { percentage, met: current >= required };
  };

  const requirements = {
    links: getRequirementStatus(eligibility.linksCount, 2000),
    bangers: getRequirementStatus(eligibility.bangersCount, 45),
    vibes: getRequirementStatus(eligibility.vibesCount, 30),
    brands: getRequirementStatus(eligibility.brandsCount, 15),
    accountAge: getRequirementStatus(eligibility.accountAge, 90),
  };

  const allRequirementsMet =
    requirements.links.met &&
    requirements.bangers.met &&
    requirements.vibes.met &&
    requirements.brands.met &&
    requirements.accountAge.met &&
    eligibility.isActive;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.navigate('Hub' as never)} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Fund</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIconContainer}>
          <DollarSign size={64} color="#10B981" />
        </View>
        <Text style={styles.heroTitle}>Earn from Your Content</Text>
        <Text style={styles.heroText}>
          Join our Creator Fund and earn 10% of all profits generated from your content, with plans to increase to 15% in the future.
          Get rewarded for your creativity and engagement on the platform.
        </Text>
      </View>

      {/* Eligibility Status */}
      <View style={styles.eligibilityContainer}>
        <Text style={styles.sectionTitle}>Your Eligibility Status</Text>
        <View style={styles.requirementsContainer}>
          {/* Links Requirement */}
          <View style={styles.requirement}>
            <View style={styles.requirementHeader}>
              <View style={styles.requirementIconLabel}>
                <Users size={20} color="#9333EA" />
                <Text style={styles.requirementLabel}>Links</Text>
              </View>
              <View style={styles.requirementValueContainer}>
                <Text style={styles.requirementValue}>{eligibility.linksCount} / 2,000</Text>
                {requirements.links.met ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <XCircle size={20} color="#EF4444" />
                )}
              </View>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${requirements.links.percentage}%`, backgroundColor: '#9333EA' },
                ]}
              />
            </View>
          </View>
          {/* Bangers Requirement */}
          <View style={styles.requirement}>
            <View style={styles.requirementHeader}>
              <View style={styles.requirementIconLabel}>
                <Film size={20} color="#3B82F6" />
                <Text style={styles.requirementLabel}>Bangers</Text>
              </View>
              <View style={styles.requirementValueContainer}>
                <Text style={styles.requirementValue}>{eligibility.bangersCount} / 45</Text>
                {requirements.bangers.met ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <XCircle size={20} color="#EF4444" />
                )}
              </View>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${requirements.bangers.percentage}%`, backgroundColor: '#3B82F6' },
                ]}
              />
            </View>
          </View>
          {/* Vibes Requirement */}
          <View style={styles.requirement}>
            <View style={styles.requirementHeader}>
              <View style={styles.requirementIconLabel}>
                <ImageIcon size={20} color="#EC4899" />
                <Text style={styles.requirementLabel}>Vibes</Text>
              </View>
              <View style={styles.requirementValueContainer}>
                <Text style={styles.requirementValue}>{eligibility.vibesCount} / 30</Text>
                {requirements.vibes.met ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <XCircle size={20} color="#EF4444" />
                )}
              </View>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${requirements.vibes.percentage}%`, backgroundColor: '#EC4899' },
                ]}
              />
            </View>
          </View>
          {/* Account Age Requirement */}
          <View style={styles.requirement}>
            <View style={styles.requirementHeader}>
              <View style={styles.requirementIconLabel}>
                <Calendar size={20} color="#FBBF24" />
                <Text style={styles.requirementLabel}>Account Age</Text>
              </View>
              <View style={styles.requirementValueContainer}>
                <Text style={styles.requirementValue}>{eligibility.accountAge} / 90 days</Text>
                {requirements.accountAge.met ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <XCircle size={20} color="#EF4444" />
                )}
              </View>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${requirements.accountAge.percentage}%`, backgroundColor: '#FBBF24' },
                ]}
              />
            </View>
          </View>
          {/* Activity Status */}
          <View style={styles.requirement}>
            <View style={[styles.requirementHeader, { justifyContent: 'space-between' }]}>
              <View style={styles.requirementIconLabel}>
                <DollarSign size={20} color="#10B981" />
                <Text style={styles.requirementLabel}>Active User Status</Text>
              </View>
              {eligibility.isActive ? (
                <View style={styles.statusBadgeActive}>
                  <Text style={styles.statusBadgeText}>Active</Text>
                </View>
              ) : (
                <View style={styles.statusBadgeInactive}>
                  <Text style={styles.statusBadgeText}>Inactive</Text>
                </View>
              )}
            </View>
            <Text style={styles.statusDescription}>
              {eligibility.isActive
                ? 'You have posted content in the last 30 days'
                : 'Post content to maintain active status'}
            </Text>
          </View>
        </View>
      </View>

      {/* Overall Status */}
      <View style={styles.overallStatusContainer}>
        <View style={styles.overallStatusRow}>
          <Text style={styles.overallStatusTitle}>Overall Status</Text>
          {allRequirementsMet && eligibility.isActive ? (
            <View style={styles.overallStatusBadgeActive}>
              <Text style={styles.overallStatusBadgeText}>Eligible</Text>
            </View>
          ) : (
            <View style={styles.overallStatusBadgeInactive}>
              <Text style={styles.overallStatusBadgeText}>
                {eligibility.isActive ? 'Requirements Not Met' : 'Inactive Account'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.overallStatusDescription}>
          {allRequirementsMet && eligibility.isActive
            ? 'Congratulations! You are eligible to join the Creator Fund.'
            : eligibility.isActive
              ? 'Keep working towards meeting all requirements to join the Creator Fund.'
              : 'Post content in the last 30 days to maintain active status.'}
        </Text>
        {allRequirementsMet && eligibility.isActive ? (
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join Creator Fund</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.checklistContainer}>
            <View style={styles.checklistBox}>
              <Text style={styles.checklistTitle}>Requirements Checklist</Text>
              <View style={styles.checklistItem}>
                {requirements.links.met ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
                <Text style={styles.checklistText}>2,000 Links ({eligibility.linksCount} current)</Text>
              </View>
              <View style={styles.checklistItem}>
                {requirements.bangers.met ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
                <Text style={styles.checklistText}>45 Bangers ({eligibility.bangersCount} current)</Text>
              </View>
              <View style={styles.checklistItem}>
                {requirements.vibes.met ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
                <Text style={styles.checklistText}>30 Vibes ({eligibility.vibesCount} current)</Text>
              </View>
              <View style={styles.checklistItem}>
                {requirements.brands.met ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
                <Text style={styles.checklistText}>15 Brands ({eligibility.brandsCount} current)</Text>
              </View>
              <View style={styles.checklistItem}>
                {requirements.accountAge.met ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
                <Text style={styles.checklistText}>90 Days Account Age</Text>
              </View>
              <View style={styles.checklistItem}>
                {eligibility.isActive ? (
                  <CheckCircle size={16} color="#10B981" />
                ) : (
                  <XCircle size={16} color="#EF4444" />
                )}
                <Text style={styles.checklistText}>Active in Last 30 Days</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksContainer}>
        <Text style={styles.howItWorksTitle}>How It Works</Text>
        <View style={styles.howItWorksItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Meet Eligibility Requirements</Text>
            <Text style={styles.stepDescription}>
              Build your presence by growing your network, creating engaging content, and maintaining regular activity.
            </Text>
          </View>
        </View>
        <View style={styles.howItWorksItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Join the Fund</Text>
            <Text style={styles.stepDescription}>
              Once eligible, join the Creator Fund to start earning from your content and engagement.
            </Text>
          </View>
        </View>
        <View style={styles.howItWorksItem}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Get Paid</Text>
            <Text style={styles.stepDescription}>
              Receive monthly payments based on your contributions. Currently, creators earn 10% of profits, with plans to increase to 15%.
            </Text>
          </View>
        </View>
      </View>

      {/* Tips for Success */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for Success</Text>
        <View style={styles.tipsGrid}>
          <View style={styles.tipCard}>
            <Users size={24} color="#9333EA" />
            <Text style={styles.tipTitle}>Grow Your Network</Text>
            <Text style={styles.tipDescription}>
              Connect with other creators and engage with your audience regularly.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Film size={24} color="#3B82F6" />
            <Text style={styles.tipTitle}>Create Quality Content</Text>
            <Text style={styles.tipDescription}>
              Focus on producing engaging bangers and vibes that resonate with your audience.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Calendar size={24} color="#FBBF24" />
            <Text style={styles.tipTitle}>Stay Consistent</Text>
            <Text style={styles.tipDescription}>
              Maintain regular activity and post content consistently to maximize earnings.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <DollarSign size={24} color="#10B981" />
            <Text style={styles.tipTitle}>Track Performance</Text>
            <Text style={styles.tipDescription}>
              Monitor your analytics and adjust your strategy to optimize earnings.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: '#111827',
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  heroSection: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    maxWidth: 360,
  },
  eligibilityContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  requirementsContainer: {
    marginTop: 8,
  },
  requirement: {
    marginBottom: 16,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  requirementValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementValue: {
    fontSize: 14,
    color: '#9CA3AF',
    marginRight: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 14,
    color: '#10B981',
  },
  statusDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  overallStatusContainer: {
    backgroundColor: '#111827',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  overallStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  overallStatusBadgeActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overallStatusBadgeInactive: {
    backgroundColor: 'rgba(234,179,8,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overallStatusBadgeText: {
    fontSize: 14,
    color: '#10B981',
  },
  overallStatusDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  joinButton: {
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  checklistContainer: {
    marginTop: 16,
  },
  checklistBox: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checklistText: {
    fontSize: 14,
    color: '#D1D5DB',
    marginLeft: 4,
  },
  howItWorksContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tipsContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipCard: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  tipDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
