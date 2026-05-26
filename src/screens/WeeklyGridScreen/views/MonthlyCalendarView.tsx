import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Activity, dateToDayOfWeek, formatDateToISO } from '@/types/schedule';

import {
  AddActivityButton,
  ViewToggleButton,
  WeekNavButton,
} from '../components/Buttons';
import { styles } from '../styles';
import { getMonthDateRange, getMonthGrid } from '../utils';

export type MonthlyCalendarViewProps = {
  activities: Activity[];
  monthOffset: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onDayPress: (date: Date) => void;
  onActivityClick?: (activity: Activity) => void;
  onToggleView: () => void;
  onAddActivity: () => void;
  colors: any;
};

export const MonthlyCalendarView = ({
  activities,
  monthOffset,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onDayPress,
  onActivityClick,
  onToggleView,
  onAddActivity,
  colors,
}: MonthlyCalendarViewProps) => {
  const grid = getMonthGrid(monthOffset);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getActivitiesForDate = (date: Date) => {
    const dateStr = formatDateToISO(date);
    const dayOfWeek = dateToDayOfWeek(date);

    return activities.filter((activity) => {
      if (activity.activityDate) {
        return activity.activityDate === dateStr;
      }
      if (activity.isRecurring) {
        return activity.day === dayOfWeek;
      }
      return false;
    });
  };

  return (
    <View style={[styles.monthlyContainer, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.monthlyHeader,
          { backgroundColor: colors.card },
          Platform.OS !== 'web' && { paddingTop: 50 },
        ]}
      >
        <View style={styles.monthlyHeaderContent}>
          <View style={styles.weekNavContainer}>
            <WeekNavButton direction="prev" onPress={onPrevMonth} colors={colors} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {getMonthDateRange(monthOffset)}
            </Text>
            <WeekNavButton direction="next" onPress={onNextMonth} colors={colors} />
            {monthOffset !== 0 && (
              <Pressable
                style={[styles.todayButton, { backgroundColor: colors.primary + '20' }]}
                onPress={onGoToToday}
              >
                <Text style={[styles.todayButtonText, { color: colors.primary }]}>Today</Text>
              </Pressable>
            )}
            <ViewToggleButton viewMode="monthly" onToggle={onToggleView} colors={colors} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AddActivityButton onPress={onAddActivity} colors={colors} />
          </View>
        </View>
      </View>

      <View
        style={[
          styles.monthlyWeekHeader,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {weekDays.map((day, index) => (
          <View key={day} style={styles.monthlyWeekDay}>
            <Text
              style={[
                styles.monthlyWeekDayText,
                { color: index >= 5 ? colors.textSecondary : colors.textPrimary },
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.monthlyGrid} showsVerticalScrollIndicator={false}>
        <View style={styles.monthlyGridInner}>
          {Array.from({ length: 6 }, (_, weekIndex) => (
            <View key={weekIndex} style={styles.monthlyWeekRow}>
              {grid.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                const dayActivities = getActivitiesForDate(day.date);
                const isWeekend = dayIndex >= 5;

                return (
                  <Pressable
                    key={dayIndex}
                    style={[
                      styles.monthlyDayCell,
                      {
                        backgroundColor: day.isToday ? colors.primary + '15' : colors.card,
                        borderColor: day.isToday ? colors.primary : colors.border,
                      },
                      !day.isCurrentMonth && { opacity: 0.4 },
                    ]}
                    onPress={() => onDayPress(day.date)}
                  >
                    <Text
                      style={[
                        styles.monthlyDayNumber,
                        {
                          color: day.isToday
                            ? colors.primary
                            : isWeekend
                            ? colors.textSecondary
                            : colors.textPrimary,
                        },
                        day.isToday && { fontWeight: '700' },
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>

                    <View style={styles.monthlyActivityIndicators}>
                      {dayActivities.slice(0, 3).map((activity) => (
                        <Pressable
                          key={activity.id}
                          style={[styles.monthlyActivityDot, { backgroundColor: activity.color }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            onActivityClick?.(activity);
                          }}
                        >
                          <Text style={styles.monthlyActivityDotText} numberOfLines={1}>
                            {activity.name}
                          </Text>
                        </Pressable>
                      ))}
                      {dayActivities.length > 3 && (
                        <Text style={[styles.monthlyMoreText, { color: colors.textSecondary }]}>
                          +{dayActivities.length - 3} more
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
