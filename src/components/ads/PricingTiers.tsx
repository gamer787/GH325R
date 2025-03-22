import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PriceTier } from '../../types/ads';

interface PricingTiersProps {
  priceTiers: PriceTier[];
  selectedTier: PriceTier | null;
  onSelectTier: (tier: PriceTier) => void;
}

export function PricingTiers({ priceTiers, selectedTier, onSelectTier }: PricingTiersProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Campaign Package</Text>

      <View style={styles.grid}>
        {priceTiers.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            onPress={() => onSelectTier(tier)}
            style={[
              styles.tierBox,
              selectedTier?.id === tier.id ? styles.selectedTier : styles.defaultTier
            ]}
          >
            <Text style={styles.price}>₹{tier.price}</Text>
            <Text style={styles.infoText}>
              {tier.duration_hours}h • {tier.radius_km}km
            </Text>
            <Text style={styles.reach}>
              {tier.radius_km >= 100 ? 'Regional' : 'Local'} Reach
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',  // bg-gray-800/50
    padding: 16,
    borderRadius: 12,
    borderColor: 'rgba(55, 65, 81, 0.5)',  // border-gray-700/50
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#06B6D4',  // text-cyan-400
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tierBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedTier: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',  // bg-cyan-400/10
  },
  defaultTier: {
    borderColor: '#374151', // border-gray-700
    backgroundColor: 'transparent',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFFF', // text-white
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF', // text-gray-400
  },
  reach: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280', // text-gray-500
  },
});
