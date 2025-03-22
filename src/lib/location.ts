import { supabase } from './supabase';
import * as Location from 'expo-location';

export interface LocationUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'personal' | 'business';
  distance: number;
  last_seen: Date;
}

class LocationDiscovery {
  private discovering: boolean = false;
  private onUserDiscovered: ((user: LocationUser) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  // Instead of watchId, we store the subscription object from expo-location.
  private locationSubscription: Location.LocationSubscription | null = null;
  // Use ReturnType<typeof setInterval> to properly type setInterval
  private discoveryInterval: ReturnType<typeof setInterval> | null = null;
  private undiscoveredUsers: Map<string, LocationUser> = new Map();
  private lastSeenTimes: Map<string, number> = new Map();

  setOnUserDiscovered(callback: (user: LocationUser) => void) {
    this.onUserDiscovered = callback;
  }

  setOnError(callback: (error: string) => void) {
    this.onError = callback;
  }

  async startDiscovering() {
    if (this.discovering) {
      return;
    }

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }

      this.discovering = true;

      // Start watching location using Expo Location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 0,
        },
        async (position: Location.LocationObject) => {
          await this.updateLocation(position.coords);
        }
      );

      // Start discovering nearby users
      await this.startUserDiscovery();
    } catch (error: any) {
      this.discovering = false;
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start location discovery';
      if (this.onError) {
        this.onError(errorMessage);
      }
      throw error;
    }
  }

  private async updateLocation(coords: Location.LocationObjectCoords) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  private async startUserDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }

    const discoverNearbyUsers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get current user's location
        const { data: currentUser } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', user.id)
          .single();

        if (!currentUser?.latitude || !currentUser?.longitude) return;

        // Find users within 500 feet (approx. 152.4 meters) who updated their location in the last 24 hours
        const { data: nearbyUsers } = await supabase.rpc('find_nearby_users', {
          user_lat: currentUser.latitude,
          user_lon: currentUser.longitude,
          max_distance: 0.1524, // in kilometers
          hours_threshold: 24,
        });

        const currentTime = Date.now();

        // Cast nearbyUsers as any[] to access properties without type errors.
        (nearbyUsers as any[])?.forEach((nearby) => {
          if (nearby && nearby.profiles && this.onUserDiscovered) {
            const discovered: LocationUser = {
              id: nearby.profiles.id,
              username: nearby.profiles.username,
              display_name: nearby.profiles.display_name,
              avatar_url: nearby.profiles.avatar_url,
              account_type: nearby.profiles.account_type,
              distance: nearby.distance * 1000, // convert to meters
              last_seen: new Date(nearby.location_updated_at),
            };

            // Update last seen time for users in range
            this.lastSeenTimes.set(discovered.id, currentTime);

            // Add to undiscovered users if not already discovered
            if (!this.undiscoveredUsers.has(discovered.id)) {
              this.undiscoveredUsers.set(discovered.id, discovered);
              this.onUserDiscovered(discovered);
            }
          }
        });

        // Remove users not seen in the last 24 hours
        const twentyFourHoursAgo = currentTime - 24 * 60 * 60 * 1000;
        this.undiscoveredUsers.forEach((userObj, id) => {
          const lastSeen = this.lastSeenTimes.get(id) || 0;
          if (lastSeen < twentyFourHoursAgo) {
            this.undiscoveredUsers.delete(id);
            this.lastSeenTimes.delete(id);
          }
        });
      } catch (error) {
        console.error('Error discovering nearby users:', error);
      }
    };

    // Start immediate discovery
    await discoverNearbyUsers();

    // Set up periodic discovery (every 30 seconds)
    this.discoveryInterval = setInterval(async () => {
      if (this.discovering) {
        await discoverNearbyUsers();
      }
    }, 30000);
  }

  stopDiscovering() {
    this.discovering = false;
    
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    // Clear user data
    this.undiscoveredUsers.clear();
    this.lastSeenTimes.clear();
  }

  getDiscoveredUsers(): LocationUser[] {
    return Array.from(this.undiscoveredUsers.values());
  }
}

export const locationDiscovery = new LocationDiscovery();
