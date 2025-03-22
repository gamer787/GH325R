import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ImageIcon, Film, Users, Building2 } from 'lucide-react-native';

// Define the Profile type locally.
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  account_type: 'business' | 'personal';
}

interface ProfileStatsProps {
  profile: Profile;
  stats: {
    vibes_count: number;
    bangers_count: number;
    links_count: number;
    brands_count: number;
  };
  onShowLinks: () => void;
  onShowBrands: () => void;
}

export function ProfileStats({
  profile,
  stats,
  onShowLinks,
  onShowBrands,
}: ProfileStatsProps) {
  const isBusiness = profile.account_type === 'business';

  return (
    <View style={styles.container}>
      {/* Vibes Count */}
      <View style={styles.statItem}>
        <Text style={styles.count}>{stats.vibes_count}</Text>
        <View style={styles.label}>
          <ImageIcon size={16} color="#9CA3AF" />
          <Text style={styles.labelText}>Vibes</Text>
        </View>
      </View>

      {/* Bangers Count */}
      <View style={styles.statItem}>
        <Text style={styles.count}>{stats.bangers_count}</Text>
        <View style={styles.label}>
          <Film size={16} color="#9CA3AF" />
          <Text style={styles.labelText}>Bangers</Text>
        </View>
      </View>

      {/* Links/Trusts Count */}
      <TouchableOpacity onPress={onShowLinks} style={styles.touchableItem}>
        <Text style={styles.count}>{stats.links_count}</Text>
        <View style={styles.label}>
          <Users size={16} color="#9CA3AF" />
          <Text style={styles.labelText}>
            {isBusiness ? 'Trusts' : 'Links'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Brands Count */}
      <TouchableOpacity onPress={onShowBrands} style={styles.touchableItem}>
        <Text style={styles.count}>{stats.brands_count}</Text>
        <View style={styles.label}>
          <Building2 size={16} color="#9CA3AF" />
          <Text style={styles.labelText}>Brands</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1F2937',
    paddingVertical: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  touchableItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    marginHorizontal: 4,
  },
  count: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  labelText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default ProfileStats;
