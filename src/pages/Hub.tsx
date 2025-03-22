import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  ChevronLeft,
  Megaphone,
  Briefcase,
  Building2,
  PlusCircle,
  Users,
  TrendingUp,
  Settings,
  AlertCircle,
  Shield,
  BadgeCheck,
  PlayCircle,
  DollarSign
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function Hub() {
  const navigation = useNavigation();
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);

  useEffect(() => {
    checkAccountType();
  }, []);

  const checkAccountType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user.id)
        .single();
      setIsBusinessAccount(profile?.account_type === 'business');
    } catch (error) {
      console.error('Error checking account type:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Central Hub</Text>
      <View style={styles.grid}>
        {/* Ads Management */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Megaphone size={32} color="#06B6D4" />
            </View>
            <Text style={styles.cardTitle}>Advertising</Text>
            <Text style={styles.cardText}>
              Create and manage your ad campaigns
            </Text>
            <TouchableOpacity
              style={styles.buttonCyan}
              onPress={() => navigation.navigate('Ads' as never)}
            >
              <Text style={styles.buttonText}>Run Ads</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Buy Badge */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <BadgeCheck size={32} color="#06B6D4" />
            </View>
            <Text style={styles.cardTitle}>Verification Badge</Text>
            <Text style={styles.cardText}>
              Get verified and stand out from the crowd
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.buttonCyan}
                onPress={() => navigation.navigate('BadgeSelection' as never)}
              >
                <Text style={styles.buttonText}>Buy Badge</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonGray}
                onPress={() => navigation.navigate('BadgeInfo' as never)}
              >
                <Text style={styles.buttonTextGray}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Job Listings */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Briefcase size={32} color="#06B6D4" />
            </View>
            <Text style={styles.cardTitle}>Job Listings</Text>
            <Text style={styles.cardText}>
              {isBusinessAccount 
                ? "Post and manage job opportunities" 
                : "View and apply for job opportunities"}
            </Text>
            <View style={styles.buttonGroup}>
              {isBusinessAccount ? (
                <>
                  <TouchableOpacity
                    style={styles.buttonCyan}
                    onPress={() => navigation.navigate('CreateJob' as never)}
                  >
                    <Text style={styles.buttonText}>Post Job</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonGray}
                    onPress={() => navigation.navigate('JobListings' as never)}
                  >
                    <Text style={styles.buttonTextGray}>Manage Listings</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.buttonCyan}
                    onPress={() => navigation.navigate('JobListings' as never)}
                  >
                    <Text style={styles.buttonText}>View Listings</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonGray}
                    onPress={() => navigation.navigate('MyApplications' as never)}
                  >
                    <Text style={styles.buttonTextGray}>My Applications</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.buttonGray}
                onPress={() => navigation.navigate('JobInfo' as never)}
              >
                <Text style={styles.buttonTextGray}>Learn More</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Business Profile */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Building2 size={32} color="#06B6D4" />
            </View>
            <Text style={styles.cardTitle}>Profile Settings</Text>
            <Text style={styles.cardText}>
              Customize your profile settings
            </Text>
            <TouchableOpacity
              style={styles.buttonGray}
              onPress={() => navigation.navigate('BusinessProfile' as never)}
            >
              <Text style={styles.buttonTextGray}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sponsored Content */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(128,90,213,0.1)' }]}>
              <PlayCircle size={32} color="#805AD5" />
            </View>
            <Text style={styles.cardTitle}>Sponsored Content</Text>
            <Text style={styles.cardText}>
              {isBusinessAccount 
                ? 'Create engaging sponsored content and reach your target audience'
                : 'Find sponsored content opportunities'}
            </Text>
            <View style={styles.buttonGroup}>
              {isBusinessAccount ? (
                <>
                  <TouchableOpacity
                    style={styles.buttonPurple}
                    onPress={() => navigation.navigate('CreateSponsored' as never)}
                  >
                    <Text style={styles.buttonText}>Create Content</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buttonGray}
                    onPress={() => navigation.navigate('SponsoredAnalytics' as never)}
                  >
                    <Text style={styles.buttonTextGray}>View Analytics</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.buttonPurple}
                  onPress={() => navigation.navigate('SponsoredOffers' as never)}
                >
                  <Text style={styles.buttonText}>View Offers</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Creator Fund */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <DollarSign size={32} color="#06B6D4" />
            </View>
            <Text style={styles.cardTitle}>Creator Fund</Text>
            <Text style={styles.cardText}>
              Earn money from your content and engagement
            </Text>
            <TouchableOpacity
              style={styles.buttonGreen}
              onPress={() => navigation.navigate('FundInfo' as never)}
            >
              <Text style={styles.buttonText}>Enroll Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics */}
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <TrendingUp size={32} color="#06B6D4" />
            </View>
            <Text style={styles.cardTitle}>Analytics</Text>
            <Text style={styles.cardText}>Track your business metrics</Text>
            <TouchableOpacity
              style={styles.buttonGray}
              onPress={() => navigation.navigate('Analytics' as never)}
            >
              <Text style={styles.buttonTextGray}>View Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsContainer}>
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <View style={styles.iconContainer}>
              <Settings size={32} color="#06B6D4" />
            </View>
            <View style={styles.settingsText}>
              <Text style={styles.settingsTitle}>Account Settings</Text>
              <Text style={styles.settingsSubtitle}>Manage your account preferences</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.buttonGray}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Text style={styles.buttonTextGray}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pro Features Banner */}
      <View style={styles.proBanner}>
        <View style={styles.proBannerRow}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(6, 182, 212, 0.1)' }]}>
            <PlusCircle size={24} color="#06B6D4" />
          </View>
          <View style={styles.proBannerText}>
            <Text style={styles.proBannerTitle}>Unlock Your Full Potential</Text>
            <Text style={styles.proBannerDescription}>
              Upgrade to access premium features, join the Creator Fund, and maximize your earnings potential.
            </Text>
            <TouchableOpacity style={styles.proBannerButton}>
              <Text style={styles.proBannerButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 80,
    paddingHorizontal: 16,
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 16,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 12,
    borderRadius: 9999,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonCyan: {
    backgroundColor: '#06B6D4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonPurple: {
    backgroundColor: '#805AD5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonGreen: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonGray: {
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextGray: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonGroup: {
    width: '100%',
  },
  settingsContainer: {
    marginTop: 16,
  },
  settingsCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    marginLeft: 12,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  proBanner: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(128,90,213,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(128,90,213,0.2)',
  },
  proBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proBannerText: {
    marginLeft: 12,
    flex: 1,
  },
  proBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  proBannerDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  proBannerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    alignItems: 'center',
  },
  proBannerButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});

