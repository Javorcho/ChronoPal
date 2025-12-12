import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/screens/AuthScreen';
import { WeeklyGridScreen } from '@/screens/WeeklyGridScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/useThemeStore';

export default function App() {
  // Select individual properties to avoid infinite loop
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.initializing);
  const initAuth = useAuthStore((state) => state.initialize);
  const signOut = useAuthStore((state) => state.signOut);

  const { colors, isDark } = useTheme();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.loadingTitle, { color: colors.textPrimary }]}>ChronoPal</Text>
          <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <>
      <WeeklyGridScreen onSignOut={signOut} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  loadingSubtitle: {
    fontSize: 14,
  },
});
