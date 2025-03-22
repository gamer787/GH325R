import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Building2,
  Mail,
  Lock,
  User,
  AtSign,
  MapPin,
  Globe,
  Briefcase,
  Phone,
} from 'lucide-react-native';
import { signIn, signUp, checkUsernameAvailability } from '../lib/auth';

// Removed import for Profile since it doesn't exist.

type AuthMode = 'signin' | 'signup';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');

  // Personal account fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');

  // Business account fields
  const [businessUsername, setBusinessUsername] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessBio, setBusinessBio] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');

  // Username availability states
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    const checkUsername = async () => {
      if (!username && !businessUsername) {
        setUsernameAvailable(null);
        return;
      }
      const currentUsername = accountType === 'personal' ? username : businessUsername;
      if (currentUsername.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      setCheckingUsername(true);
      const { available } = await checkUsernameAvailability(currentUsername);
      setUsernameAvailable(available);
      setCheckingUsername(false);
    };

    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username, businessUsername, accountType]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const currentUsername = accountType === 'personal' ? username : businessUsername;
        const { available, error: usernameError } = await checkUsernameAvailability(currentUsername);
        if (!available) {
          setError(usernameError || 'Username is not available');
          setLoading(false);
          return;
        }

        const signupData = {
          email,
          password,
          username: currentUsername,
          displayName: accountType === 'personal' ? displayName : businessName,
          accountType,
          location: accountType === 'personal' ? location : businessLocation,
          website: accountType === 'personal' ? website : businessWebsite,
          bio: accountType === 'personal' ? bio : businessBio,
          ...(accountType === 'business' && {
            industry,
            phone: businessPhone,
          }),
        };
        const { error } = await signUp(signupData);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Helper component to render a username input with status indicator.
  const renderUsernameInput = (isPersonal: boolean) => {
    const value = isPersonal ? username : businessUsername;
    const setValue = isPersonal ? setUsername : setBusinessUsername;
    const showStatus = mode === 'signup' && value.length >= 3;

    return (
      <View style={styles.inputGroup}>
        <View style={styles.inputWrapper}>
          <View style={styles.iconWrapper}>
            <AtSign size={20} color="#9CA3AF" />
          </View>
          <TextInput
            style={[
              styles.input,
              showStatus &&
                (usernameAvailable
                  ? { borderColor: '#10B981' }
                  : { borderColor: '#EF4444' }),
            ]}
            placeholder={isPersonal ? 'Username' : 'Business Username'}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={setValue}
            autoCapitalize="none"
          />
          {showStatus && (
            <View style={styles.statusWrapper}>
              {checkingUsername ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : usernameAvailable ? (
                <Text style={{ color: '#10B981' }}>✓</Text>
              ) : (
                <Text style={{ color: '#EF4444' }}>×</Text>
              )}
            </View>
          )}
        </View>
        {showStatus && !checkingUsername && !usernameAvailable && (
          <Text style={styles.errorText}>Username is already taken</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={styles.subTitle}>
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <Text style={styles.link} onPress={() => setMode('signup')}>
                  Sign up
                </Text>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Text style={styles.link} onPress={() => setMode('signin')}>
                  Sign in
                </Text>
              </>
            )}
          </Text>
        </View>

        {/* Form */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          {mode === 'signin' ? (
            // Signin: Identifier (email or username)
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <View style={styles.iconWrapper}>
                  <Mail size={20} color="#9CA3AF" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Username"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>
          ) : (
            <>
              {renderUsernameInput(accountType === 'personal')}

              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <View style={styles.iconWrapper}>
                    <Mail size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Account Type toggle */}
              <View style={styles.accountTypeContainer}>
                <Text style={styles.label}>Account Type</Text>
                <View style={styles.accountTypeButtons}>
                  <TouchableOpacity
                    onPress={() => setAccountType('personal')}
                    style={[
                      styles.accountButton,
                      accountType === 'personal' && styles.accountButtonActive,
                    ]}
                  >
                    <User size={24} color={accountType === 'personal' ? '#06B6D4' : '#9CA3AF'} />
                    <Text
                      style={[
                        styles.accountButtonText,
                        accountType === 'personal' && styles.accountButtonTextActive,
                      ]}
                    >
                      Personal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setAccountType('business')}
                    style={[
                      styles.accountButton,
                      accountType === 'business' && styles.accountButtonActive,
                    ]}
                  >
                    <Building2 size={24} color={accountType === 'business' ? '#06B6D4' : '#9CA3AF'} />
                    <Text
                      style={[
                        styles.accountButtonText,
                        accountType === 'business' && styles.accountButtonTextActive,
                      ]}
                    >
                      Business
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {accountType === 'personal' ? (
                <>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <User size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Display Name"
                        placeholderTextColor="#9CA3AF"
                        value={displayName}
                        onChangeText={setDisplayName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <MapPin size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Location (optional)"
                        placeholderTextColor="#9CA3AF"
                        value={location}
                        onChangeText={setLocation}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <Globe size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Website (optional)"
                        placeholderTextColor="#9CA3AF"
                        value={website}
                        onChangeText={setWebsite}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Bio (optional)"
                      placeholderTextColor="#9CA3AF"
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <Building2 size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Business Name"
                        placeholderTextColor="#9CA3AF"
                        value={businessName}
                        onChangeText={setBusinessName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <Briefcase size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Industry"
                        placeholderTextColor="#9CA3AF"
                        value={industry}
                        onChangeText={setIndustry}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <MapPin size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Business Location"
                        placeholderTextColor="#9CA3AF"
                        value={businessLocation}
                        onChangeText={setBusinessLocation}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <Phone size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Business Phone"
                        placeholderTextColor="#9CA3AF"
                        value={businessPhone}
                        onChangeText={setBusinessPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.iconWrapper}>
                        <Globe size={20} color="#9CA3AF" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="Business Website"
                        placeholderTextColor="#9CA3AF"
                        value={businessWebsite}
                        onChangeText={setBusinessWebsite}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Business Description"
                      placeholderTextColor="#9CA3AF"
                      value={businessBio}
                      onChangeText={setBusinessBio}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              )}
            </>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <View style={styles.iconWrapper}>
                <Lock size={20} color="#9CA3AF" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitButton, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : mode === 'signin' ? (
              <Text style={styles.submitButtonText}>Sign in</Text>
            ) : (
              <Text style={styles.submitButtonText}>Create account</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  innerContainer: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subTitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  link: {
    color: '#06B6D4',
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#EF4444',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  formGroup: {
    backgroundColor: 'transparent',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  input: {
    height: 40,
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
    paddingBottom: 8,
  },
  statusWrapper: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  accountTypeContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#D1D5DB',
    marginBottom: 8,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  accountButtonActive: {
    borderColor: '#06B6D4',
    backgroundColor: 'rgba(6,182,212,0.1)',
  },
  accountButtonText: {
    marginTop: 4,
    fontSize: 14,
    color: '#9CA3AF',
  },
  accountButtonTextActive: {
    color: '#06B6D4',
  },
  submitButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default Auth;
