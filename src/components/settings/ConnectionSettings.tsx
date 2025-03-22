import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { 
  Bluetooth, 
  Smartphone, 
  MapPin, 
  Wifi, 
  RotateCcw, 
  Radio, 
  Compass 
} from 'lucide-react-native';

import { supabase } from '../../lib/supabase';
import { bluetoothScanner } from '../../lib/bluetooth';
import { nfcScanner } from '../../lib/nfc';
import { locationDiscovery } from '../../lib/location';

interface ConnectionPreference {
  type: string;
  enabled: boolean;
  description: string;
  lastUpdated: string | null;
}

interface LocationPreference {
  enabled: boolean;
  accuracy: 'high' | 'medium' | 'low';
  autoUpdate: boolean;
  shareWithFriends: boolean;
  lastUpdated: string | null;
}

interface ConnectionSettings {
  bluetooth: ConnectionPreference;
  nfc: ConnectionPreference;
  location: LocationPreference;
  backgroundSync: ConnectionPreference;
  autoConnect: ConnectionPreference;
}

const defaultSettings: ConnectionSettings = {
  bluetooth: {
    type: 'bluetooth',
    enabled: true,
    description: 'Discover nearby users using Bluetooth',
    lastUpdated: null,
  },
  nfc: {
    type: 'nfc',
    enabled: true,
    description: 'Connect instantly with NFC tap',
    lastUpdated: null,
  },
  location: {
    enabled: true,
    accuracy: 'high',
    autoUpdate: true,
    shareWithFriends: false,
    lastUpdated: null,
  },
  backgroundSync: {
    type: 'backgroundSync',
    enabled: true,
    description: 'Keep discovering users while app is in background',
    lastUpdated: null,
  },
  autoConnect: {
    type: 'autoConnect',
    enabled: false,
    description: 'Automatically connect with trusted users nearby',
    lastUpdated: null,
  },
};

export function ConnectionSettings() {
  const [settings, setSettings] = useState<ConnectionSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadSettings();

    return () => {
      // Clean up scanning on unmount
      bluetoothScanner.stopScanning();
      nfcScanner.stopScanning();
      locationDiscovery.stopDiscovering();
    };
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check NFC availability
      const nfcAvailable = await nfcScanner.isAvailable();
      if (!nfcAvailable) {
        // Disable NFC if not available
        defaultSettings.nfc.enabled = false;
        defaultSettings.nfc.description = 'NFC is not supported on this device';
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('connection_preferences')
        .eq('id', user.id)
        .single();

      if (profile?.connection_preferences) {
        setSettings(profile.connection_preferences);

        // Start services based on saved preferences
        if (profile.connection_preferences.bluetooth?.enabled) {
          bluetoothScanner.startScanning();
        }
        if (profile.connection_preferences.nfc?.enabled && nfcAvailable) {
          nfcScanner.startScanning();
        }
        if (profile.connection_preferences.location?.enabled) {
          locationDiscovery.startDiscovering();
        }
        setScanning(true);
      }
    } catch (err) {
      console.error('Error loading connection settings:', err);
      setError('Failed to load connection preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: ConnectionSettings) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          connection_preferences: newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSettings(newSettings);
      setSuccess('Connection preferences updated successfully');

      // Update scanning services based on changes
      if (newSettings.bluetooth.enabled !== settings.bluetooth.enabled) {
        newSettings.bluetooth.enabled
          ? bluetoothScanner.startScanning()
          : bluetoothScanner.stopScanning();
      }

      if (newSettings.nfc.enabled !== settings.nfc.enabled) {
        const nfcAvailable = await nfcScanner.isAvailable();
        newSettings.nfc.enabled && nfcAvailable
          ? nfcScanner.startScanning()
          : nfcScanner.stopScanning();
      }

      if (newSettings.location.enabled !== settings.location.enabled) {
        newSettings.location.enabled
          ? locationDiscovery.startDiscovering()
          : locationDiscovery.stopDiscovering();
      }

      setScanning(
        newSettings.bluetooth.enabled ||
          newSettings.nfc.enabled ||
          newSettings.location.enabled
      );
    } catch (err) {
      console.error('Error saving connection settings:', err);
      setError('Failed to save connection preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key: keyof ConnectionSettings) => {
    if (key === 'location') {
      const newSettings = {
        ...settings,
        location: {
          ...settings.location,
          enabled: !settings.location.enabled,
          lastUpdated: new Date().toISOString(),
        },
      };
      await saveSettings(newSettings);
    } else {
      const newSettings = {
        ...settings,
        [key]: {
          ...settings[key],
          enabled: !settings[key].enabled,
          lastUpdated: new Date().toISOString(),
        },
      };
      await saveSettings(newSettings);
    }
  };

  const handleLocationAccuracyChange = async (accuracy: 'high' | 'medium' | 'low') => {
    const newSettings = {
      ...settings,
      location: {
        ...settings.location,
        accuracy,
        lastUpdated: new Date().toISOString(),
      },
    };
    await saveSettings(newSettings);
  };

  const handleResetDefaults = async () => {
    const resetSettings = {
      ...defaultSettings,
      ...Object.keys(defaultSettings).reduce((acc, key) => ({
        ...acc,
        [key]: {
          ...defaultSettings[key as keyof ConnectionSettings],
          lastUpdated: new Date().toISOString(),
        },
      }), {}),
    };
    await saveSettings(resetSettings);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth size={20} color="#9CA3AF" />;
      case 'nfc':
        return <Smartphone size={20} color="#9CA3AF" />;
      case 'backgroundSync':
        return <Radio size={20} color="#9CA3AF" />;
      case 'autoConnect':
        return <Wifi size={20} color="#9CA3AF" />;
      default:
        return <Bluetooth size={20} color="#9CA3AF" />;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.headerText}>Connection Settings</Text>
          {scanning && (
            <View style={styles.scanningContainer}>
              <View style={styles.scanningDot} />
              <Text style={styles.scanningText}>Scanning for nearby users...</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleResetDefaults} style={styles.resetButton}>
          <RotateCcw size={16} color="#FFFFFF" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Status Messages */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      {/* Connection Settings */}
      <View style={styles.settingsContainer}>
        {Object.entries(settings).map(([key, setting]) => {
          if (key === 'location') {
            return (
              <View key={key} style={styles.locationContainer}>
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View
                      style={[
                        styles.iconContainer,
                        setting.enabled ? styles.iconEnabled : styles.iconDisabled,
                      ]}
                    >
                      <MapPin size={20} color={setting.enabled ? "#22d3ee" : "#9CA3AF"} />
                    </View>
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTitle}>Location Services</Text>
                      <Text style={styles.settingDescription}>Share and update your location</Text>
                      {setting.lastUpdated && (
                        <Text style={styles.timestamp}>
                          Last updated: {new Date(setting.lastUpdated).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggle('location')}
                    disabled={saving}
                    style={[
                      styles.toggleButton,
                      { backgroundColor: setting.enabled ? '#06B6D4' : '#374151' },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleCircle,
                        { transform: [{ translateX: setting.enabled ? 24 : 0 }] },
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {setting.enabled && (
                  <View style={styles.locationExtraContainer}>
                    {/* Location Accuracy */}
                    <View style={styles.subSection}>
                      <Text style={styles.subLabel}>Location Accuracy</Text>
                      <View style={styles.accuracyButtonsContainer}>
                        {['high', 'medium', 'low'].map((accuracy) => (
                          <TouchableOpacity
                            key={accuracy}
                            onPress={() =>
                              handleLocationAccuracyChange(accuracy as 'high' | 'medium' | 'low')
                            }
                            style={[
                              styles.accuracyButton,
                              setting.accuracy === accuracy
                                ? styles.accuracyButtonActive
                                : styles.accuracyButtonInactive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.accuracyButtonText,
                                setting.accuracy === accuracy && styles.accuracyButtonTextActive,
                              ]}
                            >
                              {accuracy.charAt(0).toUpperCase() + accuracy.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Auto-Update Location */}
                    <View style={styles.subSectionRow}>
                      <View>
                        <Text style={styles.subTitle}>Auto-Update Location</Text>
                        <Text style={styles.subDescription}>Update location in background</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const newSettings = {
                            ...settings,
                            location: {
                              ...settings.location,
                              autoUpdate: !settings.location.autoUpdate,
                              lastUpdated: new Date().toISOString(),
                            },
                          };
                          saveSettings(newSettings);
                        }}
                        style={[
                          styles.toggleButton,
                          { backgroundColor: setting.autoUpdate ? '#06B6D4' : '#374151' },
                        ]}
                      >
                        <View
                          style={[
                            styles.toggleCircle,
                            { transform: [{ translateX: setting.autoUpdate ? 24 : 0 }] },
                          ]}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Share with Friends */}
                    <View style={styles.subSectionRow}>
                      <View>
                        <Text style={styles.subTitle}>Share with Friends</Text>
                        <Text style={styles.subDescription}>Let friends see your location</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const newSettings = {
                            ...settings,
                            location: {
                              ...settings.location,
                              shareWithFriends: !settings.location.shareWithFriends,
                              lastUpdated: new Date().toISOString(),
                            },
                          };
                          saveSettings(newSettings);
                        }}
                        style={[
                          styles.toggleButton,
                          { backgroundColor: setting.shareWithFriends ? '#06B6D4' : '#374151' },
                        ]}
                      >
                        <View
                          style={[
                            styles.toggleCircle,
                            { transform: [{ translateX: setting.shareWithFriends ? 24 : 0 }] },
                          ]}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          }

          return (
            <View key={key} style={styles.settingContainer}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconContainer,
                    setting.enabled ? styles.iconEnabled : styles.iconDisabled,
                  ]}
                >
                  {getIcon(setting.type)}
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>
                    {key === 'backgroundSync'
                      ? 'Background Sync'
                      : key === 'autoConnect'
                      ? 'Auto Connect'
                      : key.toUpperCase()}
                  </Text>
                  <Text style={styles.settingDescription}>{setting.description}</Text>
                  {setting.lastUpdated && (
                    <Text style={styles.timestamp}>
                      Last updated: {new Date(setting.lastUpdated).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleToggle(key as keyof ConnectionSettings)}
                disabled={saving}
                style={[
                  styles.toggleButton,
                  { backgroundColor: setting.enabled ? '#06B6D4' : '#374151' },
                ]}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    { transform: [{ translateX: setting.enabled ? 24 : 0 }] },
                  ]}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#111827',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scanningDot: {
    width: 8,
    height: 8,
    backgroundColor: '#06B6D4',
    borderRadius: 4,
    marginRight: 4,
  },
  scanningText: {
    fontSize: 14,
    color: '#06B6D4',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  successText: {
    color: '#10B981',
    fontSize: 14,
  },
  settingsContainer: {
    marginBottom: 16,
  },
  settingContainer: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 999,
    marginRight: 12,
  },
  iconEnabled: {
    backgroundColor: 'rgba(6,182,212,0.1)',
  },
  iconDisabled: {
    backgroundColor: '#1F2937',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  toggleButton: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    padding: 2,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  // Location-specific styles
  locationContainer: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationExtraContainer: {
    paddingLeft: 56,
    marginTop: 12,
  },
  subSection: {
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  accuracyButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accuracyButton: {
    flex: 1,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  accuracyButtonActive: {
    backgroundColor: '#06B6D4',
  },
  accuracyButtonInactive: {
    backgroundColor: '#374151',
  },
  accuracyButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  accuracyButtonTextActive: {
    color: '#1F2937',
  },
  subSectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default ConnectionSettings;
