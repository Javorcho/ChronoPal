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
  View,
} from 'react-native';

import { OAuthProvider } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/useThemeStore';

// ===========================================
// VALIDATION HELPERS
// ===========================================

// List of common valid email domains
const VALID_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com',
  'mail.com', 'zoho.com', 'yandex.com', 'gmx.com', 'inbox.com',
  // Educational
  'edu', 'ac.uk', 'edu.au',
  // Country domains (allow any)
  'co.uk', 'com.au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at',
  'bg', 'pl', 'cz', 'sk', 'hu', 'ro', 'ru', 'ua', 'jp', 'kr', 'cn',
  'in', 'br', 'mx', 'ar', 'ca', 'nz', 'za',
];

const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const trimmed = email.trim().toLowerCase();
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  // Extract domain
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  const domain = parts[1];
  
  // Check if domain has at least one dot
  if (!domain.includes('.')) {
    return { valid: false, error: 'Email domain must be valid (e.g., gmail.com)' };
  }

  // Check domain length
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { valid: false, error: 'Email domain must have a valid extension' };
  }

  // Check against known valid domains or allow corporate/custom domains
  const isKnownDomain = VALID_DOMAINS.some(d => 
    domain === d || domain.endsWith('.' + d)
  );
  
  // Allow any domain with proper structure (for corporate emails)
  // Just ensure it's not obviously fake
  if (!isKnownDomain && domainParts.length < 2) {
    return { valid: false, error: 'Please use a valid email domain' };
  }

  return { valid: true };
};

type PasswordRequirement = {
  label: string;
  test: (password: string) => boolean;
};

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors = PASSWORD_REQUIREMENTS
    .filter(req => !req.test(password))
    .map(req => req.label);
  
  return { valid: errors.length === 0, errors };
};

// ===========================================
// COMPONENTS
// ===========================================

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

// Password requirement indicator
const PasswordRequirementItem = ({ 
  label, 
  met, 
  colors 
}: { 
  label: string; 
  met: boolean; 
  colors: any;
}) => (
  <View style={styles.requirementItem}>
    <Ionicons 
      name={met ? 'checkmark-circle' : 'ellipse-outline'} 
      size={16} 
      color={met ? colors.success : colors.placeholder} 
    />
    <Text style={[
      styles.requirementText, 
      { color: met ? colors.success : colors.placeholder }
    ]}>
      {label}
    </Text>
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

// Social provider button
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

// ===========================================
// MAIN COMPONENT
// ===========================================

export const AuthScreen = () => {
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
  const [formError, setFormError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isAnyLoading = loading || !!oauthLoading;

  // Validation states
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;

  // Check if form is valid for submission
  const isFormValid = () => {
    if (!email.trim() || !password.trim()) return false;
    if (!emailValidation.valid) return false;
    
    if (isSignUp) {
      if (!passwordValidation.valid) return false;
      if (!confirmPassword.trim()) return false;
      if (!passwordsMatch) return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    setFormError('');

    // Validate email
    if (!emailValidation.valid) {
      setFormError(emailValidation.error || 'Invalid email');
      return;
    }

    // Validate password for signup
    if (isSignUp) {
      if (!passwordValidation.valid) {
        setFormError('Password does not meet requirements');
        return;
      }
      if (!passwordsMatch) {
        setFormError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // Sign up - if email confirmation is disabled, session is created automatically
        const { sessionCreated } = await signUp({ email: email.trim(), password });
        // Only sign in manually if Supabase didn't create a session (email confirmation enabled)
        if (!sessionCreated) {
          // This shouldn't happen if email confirmation is disabled
          // User will be redirected automatically via onAuthStateChange
        }
      } else {
        await signIn({ email: email.trim(), password });
      }
    } catch (err) {
      // Error is handled by the store
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (formError) setFormError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (formError) setFormError('');
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
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: emailTouched && !emailValidation.valid && email.length > 0
                      ? colors.error 
                      : colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => setEmailTouched(true)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!isAnyLoading}
              />
              {emailTouched && !emailValidation.valid && email.length > 0 && (
                <Text style={[styles.fieldError, { color: colors.error }]}>
                  {emailValidation.error}
                </Text>
              )}
            </View>

            {/* Password Input */}
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
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoComplete={isSignUp ? 'password-new' : 'password'}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                editable={!isAnyLoading}
              />
              
              {/* Password Requirements - Only show during signup when user has started typing */}
              {isSignUp && password.length > 0 && (
                <View style={[styles.requirementsContainer, { backgroundColor: colors.inputBackground }]}>
                  <Text style={[styles.requirementsTitle, { color: colors.textSecondary }]}>
                    Password requirements:
                  </Text>
                  {PASSWORD_REQUIREMENTS.map((req, index) => (
                    <PasswordRequirementItem
                      key={index}
                      label={req.label}
                      met={req.test(password)}
                      colors={colors}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Confirm Password - Only for signup */}
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
                      borderColor: confirmPassword.length > 0 && !passwordsMatch
                        ? colors.error
                        : colors.inputBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (formError) setFormError('');
                  }}
                  secureTextEntry
                  autoComplete="password-new"
                  textContentType="newPassword"
                  editable={!isAnyLoading}
                />
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <Text style={[styles.fieldError, { color: colors.error }]}>
                    Passwords do not match
                  </Text>
                )}
              </View>
            )}

            {/* Error Display */}
            {(formError || error) && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {formError || error}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <SubmitButton
              onPress={handleSubmit}
              loading={loading}
              disabled={isAnyLoading || !isFormValid()}
              label={isSignUp ? 'Create Account' : 'Sign In'}
              primaryColor={colors.primary}
            />

            {/* Social Login - Only show for Sign In */}
            {!isSignUp && (
              <>
                <View style={styles.dividerContainer}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                    or continue with
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
                </View>

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

            {/* Switch between Sign In / Sign Up */}
            <Pressable
              style={styles.switchButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setFormError('');
                setEmailTouched(false);
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

// ===========================================
// STYLES
// ===========================================

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
  fieldError: {
    fontSize: 12,
    marginTop: 4,
  },
  requirementsContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
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
  providerIcon: {
    width: 22,
    height: 22,
  },
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
