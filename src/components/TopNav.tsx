import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export function TopNav() {
  const navigation = useNavigation();
  const route = useRoute();

  // Only render the top nav on the Home screen.
  if (route.name !== 'Home') return null;

  const handlePressNotifications = () => {
    navigation.navigate('Notifications' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>ZappaLink</Text>
        <TouchableOpacity onPress={handlePressNotifications} style={styles.iconButton}>
          <Bell size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    backgroundColor: 'rgba(17,24,39,0.95)', // Similar to bg-gray-950/95
  },
  innerContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1F2937', // Gray-900
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TopNav;
