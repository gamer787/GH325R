import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, Search, PlusSquare, User, Building2, Film } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export function Navbar() {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRouteName = route.name; // Assumes route.name is set

  const navItems = [
    { route: 'Home', icon: Home, label: 'Home' },
    { route: 'Find', icon: Search, label: 'Find' },
    { route: 'Bangers', icon: Film, label: 'Bangers' },
    { route: 'Upload', icon: PlusSquare, label: 'Create' },
    { route: 'Profile', icon: User, label: 'Profile' },
    { route: 'Hub', icon: Building2, label: 'Hub' },
  ];

  const handlePress = (routeName: string) => {
    navigation.navigate(routeName as never);
  };

  return (
    <View style={styles.navbar}>
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentRouteName === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            onPress={() => handlePress(item.route)}
            style={styles.navItem}
          >
            <IconComponent size={22} color={isActive ? '#06B6D4' : '#9CA3AF'} />
            <Text style={[styles.navLabel, { color: isActive ? '#06B6D4' : '#9CA3AF' }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1F2937', // Gray-900
    borderTopWidth: 1,
    borderTopColor: '#374151', // Gray-800
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    zIndex: 50,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    marginTop: 2,
  },
});

export default Navbar;
