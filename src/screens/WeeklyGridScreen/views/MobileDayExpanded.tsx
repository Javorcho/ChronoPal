import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/store/useThemeStore';
import { Activity, dayNames, DayOfWeek } from '@/types/schedule';

import { styles } from '../styles';

export type MobileDayExpandedProps = {
  day: DayOfWeek;
  isToday: boolean;
  onBack: () => void;
  onSignOut?: () => void;
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
};

const FULL_DAY_NAMES: Record<DayOfWeek, string> = {
  [DayOfWeek.Monday]: 'Monday',
  [DayOfWeek.Tuesday]: 'Tuesday',
  [DayOfWeek.Wednesday]: 'Wednesday',
  [DayOfWeek.Thursday]: 'Thursday',
  [DayOfWeek.Friday]: 'Friday',
  [DayOfWeek.Saturday]: 'Saturday',
  [DayOfWeek.Sunday]: 'Sunday',
};

export const MobileDayExpanded = ({
  day,
  isToday,
  onBack,
  activities,
  onActivityClick,
}: MobileDayExpandedProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.expandedHeaderContent}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.expandedHeaderCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {FULL_DAY_NAMES[day]}
            </Text>
            {isToday && (
              <View style={[styles.todayBadgeLarge, { backgroundColor: colors.primary }]}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.expandedContent}
        contentContainerStyle={styles.expandedContentInner}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.expandedDayColumn,
            { backgroundColor: colors.card },
            isToday && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          <View
            style={[
              styles.expandedDayHeader,
              isToday && { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Text
              style={[
                styles.expandedDayName,
                { color: isToday ? colors.primary : colors.textSecondary },
              ]}
            >
              {dayNames[day]}
            </Text>
          </View>

          <View style={styles.expandedActivitiesArea}>
            {activities.length === 0 ? (
              <View style={styles.emptyDay}>
                <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No activities</Text>
                <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                  Activities will appear here
                </Text>
              </View>
            ) : (
              activities.map((activity) => (
                <Pressable
                  key={activity.id}
                  style={[styles.dayActivityItem, { backgroundColor: colors.card }]}
                  onPress={() => onActivityClick?.(activity)}
                >
                  <View style={[styles.dayActivityColorBar, { backgroundColor: activity.color }]} />
                  <View style={styles.dayActivityInfo}>
                    <Text style={[styles.dayActivityName, { color: colors.textPrimary }]}>
                      {activity.name}
                    </Text>
                    <View style={styles.dayActivityMeta}>
                      <Text style={[styles.dayActivityTime, { color: colors.textSecondary }]}>
                        {activity.startTime || 'Start'} - {activity.endTime || 'End'}
                      </Text>
                      {activity.isRecurring && (
                        <View style={styles.recurringBadge}>
                          <Ionicons name="repeat" size={12} color={colors.primary} />
                          <Text style={[styles.recurringText, { color: colors.primary }]}>Weekly</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};
