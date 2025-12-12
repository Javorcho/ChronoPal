import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ActivityBlock } from '@/components/ActivityBlock';
import { useDayActivities, useScheduleStore } from '@/store/useScheduleStore';
import { useTheme } from '@/store/useThemeStore';
import { Activity, dayNames, DayOfWeek } from '@/types/schedule';

type DayDetailScreenProps = {
  day: DayOfWeek;
  onBack: () => void;
  onEditActivity: (activity: Activity) => void;
  onAddActivity: () => void;
};

// Time slots from 6 AM to 11 PM
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const hour = i + 6;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const FULL_DAY_NAMES: Record<DayOfWeek, string> = {
  [DayOfWeek.Monday]: 'Monday',
  [DayOfWeek.Tuesday]: 'Tuesday',
  [DayOfWeek.Wednesday]: 'Wednesday',
  [DayOfWeek.Thursday]: 'Thursday',
  [DayOfWeek.Friday]: 'Friday',
  [DayOfWeek.Saturday]: 'Saturday',
  [DayOfWeek.Sunday]: 'Sunday',
};

export const DayDetailScreen = ({
  day,
  onBack,
  onEditActivity,
  onAddActivity,
}: DayDetailScreenProps) => {
  const { colors } = useTheme();
  const activities = useDayActivities(day);
  const removeActivity = useScheduleStore((state) => state.removeActivity);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Get current day info
  const today = new Date();
  const dayIndex = today.getDay();
  const currentDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const isToday = day === Object.values(DayOfWeek)[currentDayIndex];

  // Calculate total hours for the day
  const totalMinutes = activities.reduce((total, activity) => {
    const [startH, startM] = activity.startTime.split(':').map(Number);
    const [endH, endM] = activity.endTime.split(':').map(Number);
    return total + (endH * 60 + endM - (startH * 60 + startM));
  }, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const handleDelete = (activity: Activity) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${activity.name}"?`)) {
        setDeletingId(activity.id);
        removeActivity(activity.id).finally(() => setDeletingId(null));
      }
    } else {
      Alert.alert(
        'Delete Activity',
        `Are you sure you want to delete "${activity.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setDeletingId(activity.id);
              removeActivity(activity.id).finally(() => setDeletingId(null));
            },
          },
        ],
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {FULL_DAY_NAMES[day]}
          </Text>
          {isToday && (
            <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.todayText}>Today</Text>
            </View>
          )}
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={onAddActivity}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Ionicons name="list-outline" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {activities.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Activities
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {totalHours}h {remainingMinutes > 0 ? `${remainingMinutes}m` : ''}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Scheduled
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {activities.filter((a) => a.isRecurring).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Recurring
          </Text>
        </View>
      </View>

      {/* Activities List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.inputBackground }]}
            >
              <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No activities yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the + button to add your first activity for {FULL_DAY_NAMES[day]}
            </Text>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={onAddActivity}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Activity</Text>
            </Pressable>
          </View>
        ) : (
          activities.map((activity) => (
            <View
              key={activity.id}
              style={[
                styles.activityCard,
                deletingId === activity.id && styles.activityDeleting,
              ]}
            >
              <ActivityBlock activity={activity} onPress={onEditActivity} showTime />
              <View style={styles.activityActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.inputBackground }]}
                  onPress={() => onEditActivity(activity)}
                >
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
                  onPress={() => handleDelete(activity)}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.error} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  todayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  todayText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 28,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  activityCard: {
    marginBottom: 12,
  },
  activityDeleting: {
    opacity: 0.5,
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

