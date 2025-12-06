import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/screens/AuthScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { useScheduleStore } from '@/store/useScheduleStore';

export default function App() {
  // Select individual properties to avoid infinite loop
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.initializing);
  const initAuth = useAuthStore((state) => state.initialize);

  const activities = useScheduleStore((state) => state.activities);
  const scheduleLoading = useScheduleStore((state) => state.loading);
  const initSchedule = useScheduleStore((state) => state.initialize);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>ChronoPal</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ChronoPal</Text>
        <Text style={styles.subtitle}>
          {scheduleLoading ? 'Syncing weekly plan…' : 'Welcome back!'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Activities:</Text>
          <Text style={styles.metaValue}>{activities.length}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>User:</Text>
          <Text style={styles.metaValue}>{user?.email ?? user?.uid}</Text>
        </View>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#ffffff',
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
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});
