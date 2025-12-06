import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
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

import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/useThemeStore';

export const AuthScreen = () => {
  // Select individual properties to avoid infinite loop
  const initializing = useAuthStore((state) => state.initializing);
  const error = useAuthStore((state) => state.error);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);

  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isHovered, setIsHovered] = useState(false);

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
                editable={!loading}
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
                editable={!loading}
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
                  editable={!loading}
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

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                loading ||
                !email.trim() ||
                !password.trim() ||
                (isSignUp && !confirmPassword.trim())
              }
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

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
              disabled={loading}
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
});

