import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/screens/AuthScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useTheme } from '@/store/useThemeStore';

export default function App() {
  // Select individual properties to avoid infinite loop
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.initializing);
  const initAuth = useAuthStore((state) => state.initialize);

  const activities = useScheduleStore((state) => state.activities);
  const scheduleLoading = useScheduleStore((state) => state.loading);
  const initSchedule = useScheduleStore((state) => state.initialize);

  const { colors, isDark } = useTheme();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!authLoading && user) {
      initSchedule(user.uid);
    }
  }, [authLoading, user, initSchedule]);

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>ChronoPal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </SafeAreaView>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>ChronoPal</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {scheduleLoading ? 'Syncing weekly plan…' : 'Welcome back!'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Activities:</Text>
          <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{activities.length}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>User:</Text>
          <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
            {user?.email ?? user?.uid}
          </Text>
        </View>
      </View>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 14,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
