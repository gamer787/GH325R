import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
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
} from 'lucide-react-native';

export default function BadgeInfo() {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Hub' as never)}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Badges</Text>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroIconContainer}>
          <BadgeCheck size={64} color="#06B6D4" />
        </View>
        <Text style={styles.heroTitle}>Express Your Identity</Text>
        <Text style={styles.heroText}>
          Badges in ZappaLink are not verification marks – they’re a way to showcase your role, expertise,
          and creative identity in the community. Stand out and connect with others who share your interests.
        </Text>
      </View>

      {/* Benefits Grid */}
      <View style={styles.benefitsGrid}>
        <View style={styles.benefitCard}>
          <View style={styles.iconWrapper}>
            <Zap size={24} color="#06B6D4" />
          </View>
          <Text style={styles.benefitTitle}>Enhanced Visibility</Text>
          <Text style={styles.benefitText}>
            Your badge appears prominently on your profile and posts, making your content more noticeable.
          </Text>
        </View>
        <View style={styles.benefitCard}>
          <View style={styles.iconWrapper}>
            <Users size={24} color="#06B6D4" />
          </View>
          <Text style={styles.benefitTitle}>Community Recognition</Text>
          <Text style={styles.benefitText}>
            Display your professional role or creative pursuit, making it easier for others to identify and connect.
          </Text>
        </View>
        <View style={styles.benefitCard}>
          <View style={styles.iconWrapper}>
            <Globe size={24} color="#06B6D4" />
          </View>
          <Text style={styles.benefitTitle}>Network Building</Text>
          <Text style={styles.benefitText}>
            Find and connect with others in your field or industry. Build meaningful professional relationships.
          </Text>
        </View>
        <View style={styles.benefitCard}>
          <View style={styles.iconWrapper}>
            <Sparkles size={24} color="#06B6D4" />
          </View>
          <Text style={styles.benefitTitle}>Creative Expression</Text>
          <Text style={styles.benefitText}>
            Choose from a variety of badges that best represent your role, allowing you to express your identity creatively.
          </Text>
        </View>
      </View>

      {/* Additional Benefits */}
      <View style={styles.additionalBenefitsGrid}>
        <View style={styles.additionalCard}>
          <View style={styles.iconWrapper}>
            <Rocket size={24} color="#06B6D4" />
          </View>
          <Text style={styles.additionalTitle}>Career Growth</Text>
          <Text style={styles.additionalText}>
            Showcase your professional journey and connect with opportunities. Badges highlight your expertise.
          </Text>
        </View>
        <View style={styles.additionalCard}>
          <View style={styles.iconWrapper}>
            <Target size={24} color="#06B6D4" />
          </View>
          <Text style={styles.additionalTitle}>Targeted Networking</Text>
          <Text style={styles.additionalText}>
            Connect with peers in your specific field. Badges make it easier to identify and engage with professionals.
          </Text>
        </View>
        <View style={styles.additionalCard}>
          <View style={styles.iconWrapper}>
            <Palette size={24} color="#06B6D4" />
          </View>
          <Text style={styles.additionalTitle}>Personal Branding</Text>
          <Text style={styles.additionalText}>
            Build a distinctive presence on ZappaLink. Your badge creates a cohesive personal brand reflecting your identity.
          </Text>
        </View>
      </View>

      {/* Important Note */}
      <View style={styles.noteContainer}>
        <View style={styles.noteIconWrapper}>
          <Shield size={24} color="#FBBF24" />
        </View>
        <View style={styles.noteTextContainer}>
          <Text style={styles.noteTitle}>Important Note</Text>
          <Text style={styles.noteText}>
            Badges on ZappaLink are not verification badges. They are a way to express your role and identity.
            They do not verify credentials or authenticity. Exercise your own judgment when interacting with others.
          </Text>
        </View>
      </View>

      {/* Get Badge Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('BadgeSelection' as never)}
          style={styles.getBadgeButton}
        >
          <BadgeCheck size={20} color="#111827" />
          <Text style={styles.getBadgeButtonText}>Get Your Badge</Text>
        </TouchableOpacity>
        <Text style={styles.getBadgeSubtitle}>
          Express your professional identity with a ZappaLink badge
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingBottom: 20,
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
  heroSection: {
    backgroundColor: 'rgba(6,182,212,0.2)',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(6,182,212,0.2)',
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
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  benefitCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: 'rgba(6,182,212,0.1)',
    padding: 12,
    borderRadius: 999,
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  additionalBenefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  additionalCard: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    width: '31%',
    marginBottom: 16,
    alignItems: 'center',
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  additionalText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  noteContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
  },
  noteIconWrapper: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    padding: 12,
    borderRadius: 999,
  },
  noteTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FBBF24',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
  getBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00E5FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  getBadgeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  getBadgeSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
