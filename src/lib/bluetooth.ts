import { supabase } from './supabase';
import { Platform } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { BleManager as RNBleManager } from 'react-native-ble-plx';

// Use a dummy BleManager on web to avoid native module errors.
const BleManager = Platform.OS === 'web'
  ? class {
      constructor() {}
      async state(): Promise<string> {
        // Always report Bluetooth as "PoweredOn" in the dummy.
        return Promise.resolve('PoweredOn');
      }
      startDeviceScan(
        _uuid: any,
        _options: any,
        callback: (error: Error | null, device: any) => void
      ) {
        // Simulate scanning by returning a dummy device after a short delay.
        setTimeout(() => {
          callback(null, { id: 'dummy-device', name: 'Dummy Device' });
        }, 1000);
      }
      stopDeviceScan() {
        // No-op for web.
      }
    }
  : RNBleManager;

export interface BluetoothUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'personal' | 'business';
  last_seen: Date;
  is_friend?: boolean;
}

class BluetoothScanner {
  private scanning: boolean = false;
  private onUserDiscovered: ((user: BluetoothUser) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private discoveredUsers: Map<string, BluetoothUser> = new Map();
  private scanInterval: NodeJS.Timeout | null = null;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private autoRetry: boolean = false;
  private backgroundMode: boolean = false;
  private deviceId: string | null = null;
  private bleManager: any;

  constructor() {
    this.bleManager = new BleManager();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const state = await this.bleManager.state();
      if (state !== 'PoweredOn') {
        throw new Error('Please enable Bluetooth on your device');
      }
      return true;
    } catch (error: any) {
      console.error('Bluetooth availability check failed:', error);
      return false;
    }
  }

  setOnUserDiscovered(callback: (user: BluetoothUser) => void) {
    this.onUserDiscovered = callback;
  }

  setOnError(callback: (error: string) => void) {
    this.onError = callback;
  }

  setBackgroundMode(enabled: boolean) {
    this.backgroundMode = enabled;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = setInterval(async () => {
        if (this.scanning) {
          await this.performScan();
        }
      }, enabled ? 30000 : 10000);
    }
  }

  private generateDeviceId(): string {
    return `${Math.random().toString(36).substring(2)}_${Date.now()}`;
  }

  async startScanning(autoRetry: boolean = false) {
    if (this.scanning) return;

    try {
      const available = await this.isAvailable();
      if (!available) {
        throw new Error('Bluetooth is not available');
      }

      this.scanning = true;
      this.autoRetry = autoRetry;
      this.discoveredUsers.clear();
      this.deviceId = this.generateDeviceId();

      await this.startContinuousScanning();
      await this.startUserDiscovery();
    } catch (error: any) {
      this.scanning = false;
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start Bluetooth scanning';
      if (this.onError) {
        this.onError(errorMessage);
      }
      if (
        this.autoRetry &&
        error instanceof Error &&
        (error.message.includes('permission') || error.message.includes('bluetooth'))
      ) {
        setTimeout(() => {
          if (!this.scanning) {
            this.startScanning(true).catch(console.error);
          }
        }, 5000);
      } else {
        throw error;
      }
    }
  }

  private async performScan() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Start scanning using BleManager for 5 seconds.
      this.bleManager.startDeviceScan(null, null, (error: Error | null, device: any) => {
        if (error) {
          if (this.onError) this.onError(error.message);
          return;
        }
        // Optionally, process each discovered device here.
      });
      setTimeout(() => {
        this.bleManager.stopDeviceScan();
      }, 5000);

      // Simulate device discovery by upserting a record in Supabase.
      await supabase
        .from('discovered_users')
        .upsert(
          {
            discoverer_id: user.id,
            discovered_id: user.id,
            bluetooth_id: 'active_user',
            last_seen: new Date().toISOString(),
          },
          { onConflict: 'discoverer_id,discovered_id' }
        );
    } catch (error: any) {
      if (
        error instanceof Error &&
        !error.message.includes('User cancelled') &&
        !error.message.includes('permission') &&
        !error.message.includes('cancelled')
      ) {
        if (this.onError) {
          this.onError(error.message);
        }
      }
    }
  }

  private async startContinuousScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    await this.performScan();
    this.scanInterval = setInterval(async () => {
      if (this.scanning) {
        await this.performScan();
      }
    }, this.backgroundMode ? 30000 : 10000);
  }

  private async startUserDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }

    const discoverUsers = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const [
          { data: nearbyUsers, error },
          { data: friends },
        ] = await Promise.all([
          supabase
            .from('discovered_users')
            .select(`
              discovered_id,
              profiles!discovered_users_discovered_id_fkey (
                id,
                username,
                display_name,
                avatar_url,
                account_type
              )
            `)
            .neq('discovered_id', user.id)
            .gt('last_seen', new Date(Date.now() - 60000).toISOString()),
          supabase
            .from('friend_requests')
            .select(`
              sender:profiles!friend_requests_sender_id_fkey (
                id,
                username,
                display_name,
                avatar_url,
                account_type
              ),
              receiver:profiles!friend_requests_receiver_id_fkey (
                id,
                username,
                display_name,
                avatar_url,
                account_type
              )
            `)
            .eq('status', 'accepted')
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
        ]);

        if (error) {
          console.error('Error fetching nearby users:', error);
          return;
        }

        nearbyUsers?.forEach((nearby: any) => {
          if (nearby.profiles) {
            const discovered: BluetoothUser = {
              id: nearby.profiles.id,
              username: nearby.profiles.username,
              display_name: nearby.profiles.display_name,
              avatar_url: nearby.profiles.avatar_url,
              account_type: nearby.profiles.account_type,
              last_seen: new Date(),
              is_friend: false,
            };
            this.discoveredUsers.set(discovered.id, discovered);
            if (this.onUserDiscovered) {
              this.onUserDiscovered(discovered);
            }
          }
        });

        friends?.forEach((friend: any) => {
          const friendProfile = friend.sender.id === user.id ? friend.receiver : friend.sender;
          const isNearby = nearbyUsers?.some((nearby: any) => nearby.discovered_id === friendProfile.id);
          if (isNearby) {
            const friendUser: BluetoothUser = {
              id: friendProfile.id,
              username: friendProfile.username,
              display_name: friendProfile.display_name,
              avatar_url: friendProfile.avatar_url,
              account_type: friendProfile.account_type,
              last_seen: new Date(),
              is_friend: true,
            };
            this.discoveredUsers.set(friendProfile.id, friendUser);
            if (this.onUserDiscovered) {
              this.onUserDiscovered(friendUser);
            }
          }
        });

        // Remove users not seen in the last 24 hours.
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.discoveredUsers.forEach((userObj, id) => {
          if (userObj.last_seen.getTime() < twentyFourHoursAgo) {
            this.discoveredUsers.delete(id);
          }
        });
      } catch (error: any) {
        console.error('Error discovering users:', error);
      }
    };

    await discoverUsers();
    this.discoveryInterval = setInterval(async () => {
      if (this.scanning) {
        await discoverUsers();
      }
    }, 3000);
  }

  stopScanning() {
    this.scanning = false;
    this.autoRetry = false;
    this.discoveredUsers.clear();
    this.deviceId = null;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  getDiscoveredUsers(): BluetoothUser[] {
    return Array.from(this.discoveredUsers.values());
  }
}

export const bluetoothScanner = new BluetoothScanner();
