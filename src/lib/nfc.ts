import { supabase } from './supabase';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

export interface NFCUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'personal' | 'business';
  last_seen: Date;
}

// Define a local interface for a profile record returned by Supabase.
interface ProfileRecord {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'personal' | 'business';
}

class NFCScanner {
  private scanning: boolean = false;
  private onUserDiscovered: ((user: NFCUser) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private discoveredUsers: Map<string, NFCUser> = new Map();

  setOnUserDiscovered(callback: (user: NFCUser) => void) {
    this.onUserDiscovered = callback;
  }

  setOnError(callback: (error: string) => void) {
    this.onError = callback;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const supported = await NfcManager.isSupported();
      return supported;
    } catch (e: any) {
      return false;
    }
  }

  async startScanning() {
    if (this.scanning) return;
    try {
      const available = await this.isAvailable();
      if (!available) {
        // Silently fail if NFC is not available
        return;
      }

      // Initialize NFC manager if needed
      await NfcManager.start();
      this.scanning = true;

      // Register tag event using react-native-nfc-manager.
      // Cast registerTagEvent to any to allow two arguments.
      await (NfcManager.registerTagEvent as any)(
        async (tag: any) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Upsert a record to simulate discovering this NFC tag.
            await supabase
              .from('discovered_users')
              .upsert({
                discoverer_id: user.id,
                discovered_id: user.id,
                bluetooth_id: `nfc:${tag.id}`, // prefix with nfc:
                last_seen: new Date().toISOString(),
              });

            // Process NDEF records.
            if (tag.ndefMessage && Array.isArray(tag.ndefMessage)) {
              for (const record of tag.ndefMessage) {
                // Check for text record
                if (
                  record &&
                  record.tnf === Ndef.TNF_WELL_KNOWN &&
                  record.type &&
                  Buffer.from(record.type).toString() === Ndef.RTD_TEXT
                ) {
                  const text = Ndef.text.decodePayload(record.payload);
                  try {
                    const userData = JSON.parse(text);
                    if (userData.userId) {
                      // Fetch profile from Supabase, casting the result to ProfileRecord.
                      const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userData.userId)
                        .single() as { data: ProfileRecord };
                      if (profile && this.onUserDiscovered) {
                        this.onUserDiscovered({
                          id: profile.id,
                          username: profile.username,
                          display_name: profile.display_name,
                          avatar_url: profile.avatar_url,
                          account_type: profile.account_type,
                          last_seen: new Date(),
                        });
                      }
                    }
                  } catch (e: any) {
                    console.error('Error parsing NFC data:', e);
                  }
                }
              }
            }
          } catch (error: any) {
            console.error('Error processing NFC tag:', error);
          }
        },
        {
          alertMessage: 'Hold your device near an NFC tag',
        }
      );
    } catch (error: any) {
      this.scanning = false;
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start NFC scanning';
      if (this.onError) {
        this.onError(errorMessage);
      }
      throw error;
    }
  }

  stopScanning() {
    this.scanning = false;
    NfcManager.unregisterTagEvent().catch((err: any) => {
      console.error('Error unregistering NFC tag event:', err);
    });
    // Clear discovered users
    this.discoveredUsers.clear();
  }

  async writeUserData(userId: string): Promise<boolean> {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const bytes = Ndef.encodeMessage([Ndef.textRecord(JSON.stringify({ userId }))]);
      if (bytes) {
        // Cast NfcManager to any so TypeScript ignores missing method typings.
        await (NfcManager as any).writeNdefMessage(bytes);
      }
      await NfcManager.cancelTechnologyRequest();
      return true;
    } catch (error: any) {
      console.error('Error writing NFC tag:', error);
      return false;
    }
  }

  getDiscoveredUsers(): NFCUser[] {
    return Array.from(this.discoveredUsers.values());
  }
}

export const nfcScanner = new NFCScanner();
