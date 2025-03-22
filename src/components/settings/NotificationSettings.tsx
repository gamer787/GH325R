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
  Bell, 
  Mail, 
  Smartphone, 
  Shield, 
  Activity, 
  Megaphone, 
  RotateCcw, 
  Loader2 
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

interface NotificationPreference {
  type: string;
  enabled: boolean;
  description: string;
  lastUpdated: string | null;
}

interface NotificationSettings {
  email: NotificationPreference;
  push: NotificationPreference;
  inApp: NotificationPreference;
  marketing: NotificationPreference;
  security: NotificationPreference;
  activity: NotificationPreference;
}

const defaultSettings: NotificationSettings = {
  email: {
    type: 'email',
    enabled: true,
    description: 'Receive important updates and notifications via email',
    lastUpdated: null
  },
  push: {
    type: 'push',
    enabled: true,
    description: 'Get instant notifications on your device',
    lastUpdated: null
  },
  inApp: {
    type: 'inApp',
    enabled: true,
    description: 'See notifications within the app',
    lastUpdated: null
  },
  marketing: {
    type: 'marketing',
    enabled: false,
    description: 'Receive updates about new features and promotions',
    lastUpdated: null
  },
  security: {
    type: 'security',
    enabled: true,
    description: 'Get alerts about security-related activities',
    lastUpdated: null
  },
  activity: {
    type: 'activity',
    enabled: true,
    description: 'Stay informed about account activity and changes',
    lastUpdated: null
  }
};

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (profile?.notification_preferences) {
        setSettings(profile.notification_preferences);
      }
    } catch (err) {
      console.error('Error loading notification settings:', err);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notification_preferences: newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSettings(newSettings);
      setSuccess('Notification preferences updated successfully');
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newSettings = {
      ...settings,
      [key]: {
        ...settings[key],
        enabled: !settings[key].enabled,
        lastUpdated: new Date().toISOString()
      }
    };
    await saveSettings(newSettings);
  };

  const handleBulkToggle = async (enabled: boolean) => {
    const newSettings = Object.keys(settings).reduce((acc, key) => ({
      ...acc,
      [key]: {
        ...settings[key as keyof NotificationSettings],
        enabled,
        lastUpdated: new Date().toISOString()
      }
    }), {} as NotificationSettings);
    await saveSettings(newSettings);
  };

  const handleResetDefaults = async () => {
    const newSettings = {
      ...defaultSettings,
      ...Object.keys(defaultSettings).reduce((acc, key) => ({
        ...acc,
        [key]: {
          ...defaultSettings[key as keyof NotificationSettings],
          lastUpdated: new Date().toISOString()
        }
      }), {})
    };
    await saveSettings(newSettings);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail size={20} color="#9CA3AF" />;
      case 'push':
        return <Smartphone size={20} color="#9CA3AF" />;
      case 'inApp':
        return <Bell size={20} color="#9CA3AF" />;
      case 'marketing':
        return <Megaphone size={20} color="#9CA3AF" />;
      case 'security':
        return <Shield size={20} color="#9CA3AF" />;
      case 'activity':
        return <Activity size={20} color="#9CA3AF" />;
      default:
        return <Bell size={20} color="#9CA3AF" />;
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
        <Text style={styles.headerText}>Notification Preferences</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => handleBulkToggle(true)} style={styles.bulkButton}>
            <Text style={styles.bulkButtonText}>Enable All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleBulkToggle(false)} style={styles.bulkButton}>
            <Text style={styles.bulkButtonText}>Disable All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleResetDefaults} style={styles.resetButton}>
            <RotateCcw size={16} color="#FFFFFF" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
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

      {/* Settings List */}
      <View style={styles.settingsList}>
        {Object.entries(settings).map(([key, setting]) => (
          <View key={key} style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[
                styles.iconContainer,
                setting.enabled ? styles.iconEnabled : styles.iconDisabled
              ]}>
                {getIcon(setting.type)}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.settingTitle}>
                  {key === 'inApp' ? 'In-App' : key} Notifications
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
              onPress={() => handleToggle(key as keyof NotificationSettings)}
              disabled={saving}
              style={[
                styles.toggleButton,
                { backgroundColor: setting.enabled ? '#06B6D4' : '#374151' }
              ]}
            >
              <View
                style={[
                  styles.toggleCircle,
                  { transform: [{ translateX: setting.enabled ? 24 : 0 }] }
                ]}
              />
            </TouchableOpacity>
          </View>
        ))}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulkButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  bulkButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 12,
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
  settingsList: {
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
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
});

export default NotificationSettings;
