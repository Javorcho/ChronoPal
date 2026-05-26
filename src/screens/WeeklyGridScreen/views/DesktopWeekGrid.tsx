import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { getActivitiesForDay } from '@/services/database/activityService';
import { useTheme } from '@/store/useThemeStore';
import {
  Activity,
  dayNames,
  DayOfWeek,
  dayOrder,
  dayToDate,
  formatDateToISO,
} from '@/types/schedule';

import {
  ActivityPanelItem,
  AddActivityButton,
  AIHelperButton,
  CloseButton,
  ImportCalendarButton,
  LogoutButton,
  MyActivitiesButton,
  ViewToggleButton,
  WeekNavButton,
} from '../components/Buttons';
import { HOUR_HEIGHT, TIME_SLOTS } from '../constants';
import { styles } from '../styles';
import { getWeekDateRange, isDayToday, parseTime } from '../utils';
import { useWeeklyGridScrollbar } from '../webScrollbar';

export type DesktopWeekGridProps = {
  currentDay: DayOfWeek;
  onSignOut?: () => void;
  onAddActivity?: () => void;
  onOpenAIPlanner?: () => void;
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  showActivitiesPanel: boolean;
  onToggleActivitiesPanel: () => void;
  onImportGoogleCalendar?: () => void;
  isImporting?: boolean;
  importError?: string | null;
  importSuccess?: number | null;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
  viewMode: 'weekly' | 'monthly';
  onToggleView: () => void;
  cancelledDates?: Map<string, Set<string>>;
};

export const DesktopWeekGrid = ({
  currentDay,
  onSignOut,
  onAddActivity,
  onOpenAIPlanner,
  activities,
  onActivityClick,
  showActivitiesPanel,
  onToggleActivitiesPanel,
  onImportGoogleCalendar,
  isImporting,
  importError,
  importSuccess,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  viewMode,
  onToggleView,
  cancelledDates,
}: DesktopWeekGridProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useWeeklyGridScrollbar();
  const TIME_GUTTER_WIDTH = 56;
  const GAP = 8;
  const PADDING = 16;
  const PANEL_WIDTH = showActivitiesPanel ? 320 : 0;
  const DAY_COLUMN_WIDTH = Math.max(
    (screenWidth - TIME_GUTTER_WIDTH - PADDING * 2 - GAP * 6 - PANEL_WIDTH) / 7,
    100,
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <View style={styles.weekNavContainer}>
            <WeekNavButton direction="prev" onPress={onPrevWeek} colors={colors} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {getWeekDateRange(weekOffset)}
            </Text>
            <WeekNavButton direction="next" onPress={onNextWeek} colors={colors} />
            {weekOffset !== 0 && (
              <Pressable
                style={[styles.todayButton, { backgroundColor: colors.primary + '20' }]}
                onPress={onGoToToday}
              >
                <Text style={[styles.todayButtonText, { color: colors.primary }]}>Today</Text>
              </Pressable>
            )}
            <ViewToggleButton viewMode={viewMode} onToggle={onToggleView} colors={colors} />
          </View>
          <View style={styles.headerActions}>
            {importError && (
              <View style={[styles.importMessage, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={[styles.importMessageText, { color: '#DC2626' }]}>{importError}</Text>
              </View>
            )}
            {importSuccess !== null && importSuccess !== undefined && (
              <View style={[styles.importMessage, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={[styles.importMessageText, { color: '#059669' }]}>
                  {importSuccess === 0
                    ? 'No events to import'
                    : `Imported ${importSuccess} event${importSuccess > 1 ? 's' : ''}`}
                </Text>
              </View>
            )}

            {onImportGoogleCalendar && (
              <ImportCalendarButton
                onPress={onImportGoogleCalendar}
                isImporting={isImporting || false}
                colors={colors}
              />
            )}

            {onOpenAIPlanner && <AIHelperButton onPress={onOpenAIPlanner} colors={colors} />}

            <MyActivitiesButton
              onPress={onToggleActivitiesPanel}
              isActive={showActivitiesPanel}
              colors={colors}
            />

            {onAddActivity && <AddActivityButton onPress={onAddActivity} colors={colors} />}
            {onSignOut && <LogoutButton onPress={onSignOut} isMobile={false} colors={colors} />}
          </View>
        </View>
      </View>

      <View style={styles.desktopGridWrapper}>
        <View style={{ width: TIME_GUTTER_WIDTH }} />

        <View style={[styles.dayColumnsWrapper, { gap: GAP }]}>
          {dayOrder.map((day, index) => {
            const isToday = isDayToday(index, weekOffset);
            return (
              <View
                key={day}
                style={[
                  styles.desktopDayColumnFull,
                  {
                    width: DAY_COLUMN_WIDTH,
                    backgroundColor: colors.card,
                  },
                  isToday && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <View
                  style={[
                    styles.desktopDayHeader,
                    isToday && { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayName,
                      { color: isToday ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {dayNames[day]}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.todayText}>Today</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.desktopGridScroll} showsVerticalScrollIndicator>
        <View style={styles.desktopGridRow}>
          <View style={[styles.timeGutter, { width: TIME_GUTTER_WIDTH }]}>
            {TIME_SLOTS.map((slot) => (
              <View key={slot.hour} style={[styles.timeGutterSlot, { height: HOUR_HEIGHT }]}>
                <Text style={[styles.timeGutterLabel, { color: colors.textSecondary }]}>
                  {slot.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.dayColumnsWrapper, { gap: GAP }]}>
            {dayOrder.map((day, index) => {
              const isToday = isDayToday(index, weekOffset);
              const dayActivities = getActivitiesForDay(
                activities,
                day,
                weekOffset,
                cancelledDates || new Map(),
              );
              const GRID_START_HOUR = 0;
              return (
                <View
                  key={day}
                  style={[
                    styles.desktopDayColumnGrid,
                    {
                      width: DAY_COLUMN_WIDTH,
                      backgroundColor: colors.card,
                    },
                    isToday && {
                      backgroundColor: colors.primary + '08',
                      borderLeftColor: colors.primary,
                      borderRightColor: colors.primary,
                      borderLeftWidth: 2,
                      borderRightWidth: 2,
                    },
                  ]}
                >
                  {dayActivities.map((a) => {
                    const startMinutes = parseTime(a.startTime);
                    const endMinutes = parseTime(a.endTime);
                    if (startMinutes === null || endMinutes === null) return null;

                    const isOvernight = endMinutes < startMinutes;
                    const displayEndMinutes = isOvernight ? 24 * 60 : endMinutes;
                    const displayDuration = displayEndMinutes - startMinutes;

                    const startHoursFromGridStart = startMinutes / 60 - GRID_START_HOUR;
                    const top = startHoursFromGridStart * HOUR_HEIGHT + 8;
                    const height = (displayDuration / 60) * HOUR_HEIGHT;

                    if (top < 0 || top > TIME_SLOTS.length * HOUR_HEIGHT) return null;

                    return (
                      <Pressable
                        key={a.id}
                        style={[
                          styles.desktopActivityBlock,
                          {
                            backgroundColor: a.color,
                            top,
                            height: Math.max(height, 24),
                            left: 2,
                            right: 2,
                          },
                        ]}
                        onPress={() => onActivityClick?.(a)}
                      >
                        <Text style={styles.desktopActivityBlockName} numberOfLines={2}>
                          {a.name}
                        </Text>
                        {isOvernight && (
                          <Text style={[styles.desktopActivityBlockName, { fontSize: 10, opacity: 0.9 }]}>
                            → Next day
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}

                  {index > 0 &&
                    (() => {
                      const prevDay = dayOrder[index - 1];
                      const prevDayActivities = getActivitiesForDay(
                        activities,
                        prevDay,
                        weekOffset,
                        cancelledDates || new Map(),
                      );

                      return prevDayActivities.map((a) => {
                        const startMinutes = parseTime(a.startTime);
                        const endMinutes = parseTime(a.endTime);
                        if (startMinutes === null || endMinutes === null) return null;
                        if (endMinutes >= startMinutes) return null;

                        const top = 8;
                        const height = (endMinutes / 60) * HOUR_HEIGHT;

                        return (
                          <Pressable
                            key={`${a.id}-continuation`}
                            style={[
                              styles.desktopActivityBlock,
                              {
                                backgroundColor: a.color,
                                opacity: 0.7,
                                top,
                                height: Math.max(height, 24),
                                left: 2,
                                right: 2,
                              },
                            ]}
                            onPress={() => onActivityClick?.(a)}
                          >
                            <Text
                              style={[styles.desktopActivityBlockName, { fontSize: 10 }]}
                              numberOfLines={1}
                            >
                              {a.name} (cont.)
                            </Text>
                          </Pressable>
                        );
                      });
                    })()}

                  {TIME_SLOTS.map((slot) => (
                    <View
                      key={slot.hour}
                      style={[
                        styles.desktopHourCell,
                        {
                          height: HOUR_HEIGHT,
                          borderTopColor: colors.border,
                          borderTopWidth: 1,
                        },
                      ]}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {(() => {
        let totalMinutes = 0;
        const weekDates = dayOrder.map((day) => formatDateToISO(dayToDate(day, weekOffset)));
        const weekStartDate = weekDates[0];
        const weekEndDate = weekDates[6];

        const countedActivityIds = new Set<string>();

        dayOrder.forEach((day) => {
          const targetDate = formatDateToISO(dayToDate(day, weekOffset));
          const dayActivities = getActivitiesForDay(activities, day, weekOffset, cancelledDates);

          dayActivities.forEach((activity) => {
            const activityKey = activity.activityDate
              ? `${activity.id}-${activity.activityDate}`
              : `${activity.id}-${targetDate}`;

            if (countedActivityIds.has(activityKey)) return;

            if (activity.activityDate) {
              if (activity.activityDate < weekStartDate || activity.activityDate > weekEndDate) {
                return;
              }
            } else if (!activity.isRecurring) {
              return;
            }

            const start = parseTime(activity.startTime);
            const end = parseTime(activity.endTime);
            if (start !== null && end !== null) {
              // Handle activities that span midnight (e.g., 23:00 to 00:00)
              const duration = end >= start ? end - start : end + 24 * 60 - start;
              totalMinutes += duration;
              countedActivityIds.add(activityKey);
            }
          });
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalHoursDisplay = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;

        const recurringCount = activities.filter((a) => a.isRecurring).length;

        const todayDate = formatDateToISO(new Date());
        const todayCount = activities.filter((a) => {
          if (a.activityDate) return a.activityDate === todayDate;
          if (a.isRecurring) return a.day === currentDay;
          return a.day === currentDay;
        }).length;

        return (
          <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalHoursDisplay}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This week</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
            <View style={styles.statItem}>
              <Ionicons name="repeat-outline" size={18} color={colors.secondary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{recurringCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recurring</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
            <View style={styles.statItem}>
              <Ionicons name="today-outline" size={18} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{todayCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
            </View>
          </View>
        );
      })()}

      {showActivitiesPanel && (
        <View
          style={[
            styles.activitiesPanel,
            { backgroundColor: colors.card, borderLeftColor: colors.border },
          ]}
        >
          <View style={styles.activitiesPanelHeader}>
            <View style={styles.activitiesPanelHeaderTop}>
              <Text style={[styles.activitiesPanelTitle, { color: colors.textPrimary }]}>
                My Activities
              </Text>
              <CloseButton onPress={onToggleActivitiesPanel} colors={colors} />
            </View>
            <Text style={[styles.activitiesPanelCount, { color: colors.textSecondary }]}>
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </Text>
          </View>

          <ScrollView style={styles.activitiesPanelScroll} showsVerticalScrollIndicator={false}>
            {activities.length === 0 ? (
              <View style={styles.activitiesPanelEmpty}>
                <Ionicons name="calendar-outline" size={40} color={colors.placeholder} />
                <Text style={[styles.activitiesPanelEmptyText, { color: colors.textSecondary }]}>
                  No activities yet
                </Text>
              </View>
            ) : (
              activities.map((activity) => (
                <ActivityPanelItem
                  key={activity.id}
                  activity={activity}
                  onPress={() => onActivityClick?.(activity)}
                  colors={colors}
                />
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
