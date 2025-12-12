import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { OAuthProvider } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/useThemeStore';

// Google "G" logo
const GoogleIcon = () => (
  <Image
    source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
    style={styles.providerIcon}
    resizeMode="contain"
  />
);

// Apple logo using Ionicons
const AppleIcon = () => (
  <Ionicons name="logo-apple" size={22} color="#000000" />
);

// Microsoft logo (4 colored squares)
const MicrosoftIcon = () => (
  <View style={styles.microsoftGrid}>
    <View style={[styles.microsoftSquare, { backgroundColor: '#f25022' }]} />
    <View style={[styles.microsoftSquare, { backgroundColor: '#7fba00' }]} />
    <View style={[styles.microsoftSquare, { backgroundColor: '#00a4ef' }]} />
    <View style={[styles.microsoftSquare, { backgroundColor: '#ffb900' }]} />
  </View>
);

// Submit button with hover effect
const SubmitButton = ({
  onPress,
  loading,
  disabled,
  label,
  primaryColor,
}: {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
  label: string;
  primaryColor: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Darken color for hover/press states
  const adjustColor = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.max(0, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.max(0, parseInt(hex.substring(4, 6), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getBackgroundColor = () => {
    if (disabled) return primaryColor;
    if (isPressed) return adjustColor(primaryColor, -40);
    if (isHovered) return adjustColor(primaryColor, -20);
    return primaryColor;
  };

  return (
    <Pressable
      style={[
        styles.submitButton,
        { backgroundColor: getBackgroundColor() },
        disabled && styles.submitButtonDisabled,
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text style={styles.submitButtonText}>{label}</Text>
      )}
    </Pressable>
  );
};

// Social provider button component following official design guidelines
const SocialButton = ({
  provider,
  onPress,
  loading,
  disabled,
}: {
  provider: OAuthProvider;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const providerStyles: Record<OAuthProvider, { label: string }> = {
    google: { label: 'Continue with Google' },
    azure: { label: 'Continue with Microsoft' },
    apple: { label: 'Continue with Apple' },
  };

  const renderIcon = () => {
    switch (provider) {
      case 'google':
        return <GoogleIcon />;
      case 'azure':
        return <MicrosoftIcon />;
      case 'apple':
        return <AppleIcon />;
    }
  };

  // Determine background color based on state
  const getBackgroundColor = () => {
    if (disabled) return '#ffffff';
    if (isPressed) return '#d0d0d0';
    if (isHovered) return '#e8e8e8';
    return '#ffffff';
  };

  return (
    <Pressable
      style={[
        styles.socialButton,
        { backgroundColor: getBackgroundColor() },
        disabled && styles.socialButtonDisabled,
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      disabled={disabled}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#000000" />
      ) : (
        <View style={styles.socialButtonContent}>
          <View style={styles.socialIconContainer}>{renderIcon()}</View>
          <Text style={styles.socialButtonText}>{providerStyles[provider].label}</Text>
        </View>
      )}
    </Pressable>
  );
};

export const AuthScreen = () => {
  // Select individual properties to avoid infinite loop
  const initializing = useAuthStore((state) => state.initializing);
  const error = useAuthStore((state) => state.error);
  const oauthLoading = useAuthStore((state) => state.oauthLoading);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signInOAuth = useAuthStore((state) => state.signInOAuth);

  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const isAnyLoading = loading || !!oauthLoading;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    // Validate password confirmation for signup
    if (isSignUp) {
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        return;
      }
      setPasswordError('');
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp({ email: email.trim(), password });
      } else {
        await signIn({ email: email.trim(), password });
      }
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>ChronoPal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!isAnyLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="••••••••"
                placeholderTextColor={colors.placeholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (isSignUp && passwordError) {
                    setPasswordError('');
                  }
                }}
                secureTextEntry
                autoComplete={isSignUp ? 'password-new' : 'password'}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                editable={!isAnyLoading}
              />
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  Confirm Password
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (passwordError) {
                      setPasswordError('');
                    }
                  }}
                  secureTextEntry
                  autoComplete="password-new"
                  textContentType="newPassword"
                  editable={!isAnyLoading}
                />
              </View>
            )}

            {passwordError && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{passwordError}</Text>
              </View>
            )}

            {error && !passwordError && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <SubmitButton
              onPress={handleSubmit}
              loading={loading}
              disabled={
                isAnyLoading ||
                !email.trim() ||
                !password.trim() ||
                (isSignUp && !confirmPassword.trim())
              }
              label={isSignUp ? 'Sign Up' : 'Sign In'}
              primaryColor={colors.primary}
            />

            {/* Social Login - Only show for Sign In */}
            {!isSignUp && (
              <>
                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                    or continue with
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtonsContainer}>
                  <SocialButton
                    provider="google"
                    onPress={() => signInOAuth('google')}
                    loading={oauthLoading === 'google'}
                    disabled={isAnyLoading}
                  />
                  <SocialButton
                    provider="azure"
                    onPress={() => signInOAuth('azure')}
                    loading={oauthLoading === 'azure'}
                    disabled={isAnyLoading}
                  />
                  <SocialButton
                    provider="apple"
                    onPress={() => signInOAuth('apple')}
                    loading={oauthLoading === 'apple'}
                    disabled={isAnyLoading}
                  />
                </View>
              </>
            )}

            <Pressable
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setPasswordError('');
              }}
              onHoverIn={() => setIsHovered(true)}
              onHoverOut={() => setIsHovered(false)}
              disabled={isAnyLoading}
            >
              <Text
                style={[
                  styles.switchText,
                  { color: colors.textSecondary },
                  isHovered && { color: colors.primary },
                ]}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    gap: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    padding: 12,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  socialButtonsContainer: {
    gap: 12,
  },
  socialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    minHeight: 50,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 24,
  },
  // Provider icon styles
  providerIcon: {
    width: 22,
    height: 22,
  },
  // Microsoft icon styles
  microsoftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 20,
    height: 20,
    gap: 2,
  },
  microsoftSquare: {
    width: 9,
    height: 9,
  },
});

