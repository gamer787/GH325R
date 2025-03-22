import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Users, Info } from 'lucide-react-native';

interface ReachEstimatorProps {
  estimatedReach: number;
  duration: number;
  radius: number;
  price: number;
}

export function ReachEstimator({ estimatedReach, duration, radius, price }: ReachEstimatorProps) {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <TrendingUp size={20} color="#06B6D4" />
          <Text style={styles.title}>Estimated Reach</Text>
        </View>

        <View>
          <View style={styles.usersInfo}>
            <Users size={20} color="#06B6D4" />
            <Text style={styles.userCount}>
              {estimatedReach.toLocaleString()}+ users
            </Text>
          </View>
          <View style={styles.info}>
            <Info size={12} color="#9CA3AF" />
            <Text style={styles.infoText}>Total users in range</Text>
          </View>
        </View>
      </View>

      {/* Price Section */}
      <View style={styles.priceContainer}>
        <Text style={styles.label}>Total Price</Text>
        <View>
          <Text style={styles.price}>₹{price}</Text>
          <Text style={styles.details}>
            {duration} hours • {radius} km reach
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)', // from-cyan-400/10
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#06B6D4',
    fontWeight: '600',
    marginLeft: 8,
  },
  usersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#9CA3AF',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  details: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
