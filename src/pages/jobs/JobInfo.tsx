import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  ChevronLeft,
  Briefcase,
  Building2,
  Users,
  Clock,
  MapPin,
  Globe,
  CheckCircle,
  Send,
} from 'lucide-react-native';

// Define the routes available in your navigator
type RootStackParamList = {
  Hub: undefined;
  JobCreate: undefined;
  // Add other routes as needed
};

// Provide the type to your navigation hook
const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

export function JobInfo() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Hub')}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Job Listings</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIconContainer}>
          <Briefcase size={64} color="#06B6D4" />
        </View>
        <Text style={styles.heroTitle}>Connect with Top Talent</Text>
        <Text style={styles.heroText}>
          Post job opportunities and connect with qualified candidates in your
          area. Our platform makes it easy to manage job listings and track
          applications all in one place.
        </Text>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresGrid}>
        <View style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Building2 size={24} color="#06B6D4" />
          </View>
          <Text style={styles.featureTitle}>Company Profile</Text>
          <Text style={styles.featureText}>
            Showcase your company with a professional profile including logo,
            description, and location. Build your employer brand.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Users size={24} color="#06B6D4" />
          </View>
          <Text style={styles.featureTitle}>Talent Pool</Text>
          <Text style={styles.featureText}>
            Access a diverse pool of qualified candidates. Review applications,
            resumes, and cover letters all in one place.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <Clock size={24} color="#06B6D4" />
          </View>
          <Text style={styles.featureTitle}>Flexible Listings</Text>
          <Text style={styles.featureText}>
            Post full-time, part-time, contract, or remote positions. Set custom
            expiration dates and manage listing status.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureIconContainer}>
            <MapPin size={24} color="#06B6D4" />
          </View>
          <Text style={styles.featureTitle}>Local Reach</Text>
          <Text style={styles.featureText}>
            Connect with talent in your area. Perfect for businesses looking to
            build local teams and strengthen community presence.
          </Text>
        </View>
      </View>

      {/* Additional Features */}
      <View style={styles.additionalFeaturesGrid}>
        <View style={styles.additionalFeatureCard}>
          <View style={styles.featureIconContainer}>
            <Globe size={24} color="#06B6D4" />
          </View>
          <Text style={styles.featureTitle}>Wide Visibility</Text>
          <Text style={styles.featureText}>
            Your job listings reach a diverse audience of professionals. Track
            views and engagement to measure your listing's performance.
          </Text>
        </View>

        <View style={styles.additionalFeatureCard}>
          <View style={styles.featureIconContainer}>
            <CheckCircle size={24} color="#06B6D4" />
          </View>
          <Text style={styles.featureTitle}>Easy Management</Text>
          <Text style={styles.featureText}>
            Simple tools to post, edit, and manage job listings. Review
            applications efficiently and communicate with candidates.
          </Text>
        </View>

        <View style={styles.additionalFeatureCard}>
          <View style={styles.featureIconContainer}>
            <Send size={24} color="#06B6D4" />
          </View>
          <Text style={styles.featureTitle}>Direct Applications</Text>
          <Text style={styles.featureText}>
            Receive applications directly through the platform. Review resumes
            and cover letters in a streamlined interface.
          </Text>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howItWorksTitle}>How It Works</Text>
        <View style={styles.howItWorksStep}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>Create Your Listing</Text>
            <Text style={styles.stepText}>
              Fill out the job details including title, description, requirements,
              and benefits. Add your company logo and customize the listing to
              attract the right candidates.
            </Text>
          </View>
        </View>
        <View style={styles.howItWorksStep}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>Publish and Manage</Text>
            <Text style={styles.stepText}>
              Choose to publish immediately or save as a draft. Set an expiration
              date and monitor views. Edit or close the listing at any time.
            </Text>
          </View>
        </View>
        <View style={styles.howItWorksStep}>
          <View style={styles.stepNumberContainer}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>Review Applications</Text>
            <Text style={styles.stepText}>
              Receive applications through the platform. Review candidate
              profiles, resumes, and cover letters. Track application status and
              communicate with applicants.
            </Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('JobCreate')}
          style={styles.ctaButton}
        >
          <Briefcase size={20} color="#111827" />
          <Text style={styles.ctaButtonText}>Post Your First Job</Text>
        </TouchableOpacity>
        <Text style={styles.ctaSubtitle}>
          Start connecting with qualified candidates today
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
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
    backgroundColor: 'rgba(6,182,212,0.125)',
    padding: 24,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroText: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    marginBottom: 16,
  },
  featureIconContainer: {
    backgroundColor: 'rgba(6,182,212,0.1)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  additionalFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  additionalFeatureCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    width: '32%',
    marginBottom: 16,
  },
  howItWorks: {
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  howItWorksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  howItWorksStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(6,182,212,0.125)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default JobInfo;
