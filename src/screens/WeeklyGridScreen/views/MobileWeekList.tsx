import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { getActivitiesForDay } from '@/services/database/activityService';
import { useTheme } from '@/store/useThemeStore';
import { Activity, dayNames, DayOfWeek, dayOrder } from '@/types/schedule';

import { LogoutButton } from '../components/Buttons';
import { styles } from '../styles';
import { getWeekDateRange, isDayToday, parseTime } from '../utils';

export type MobileWeekListProps = {
  currentDay: DayOfWeek;
  onDayPress: (day: DayOfWeek) => void;
  onSignOut?: () => void;
  onAddActivity?: () => void;
  onOpenAIPlanner?: () => void;
  activities: Activity[];
  cancelledDates?: Map<string, Set<string>>;
  activeTab: 'calendar' | 'add' | 'ai';
  onTabChange: (tab: 'calendar' | 'add' | 'ai') => void;
  onActivityClick?: (activity: Activity) => void;
  onImportGoogleCalendar?: () => void;
  isImporting?: boolean;
  importError?: string | null;
  importSuccess?: number | null;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  viewMode: 'weekly' | 'monthly';
  onToggleView: () => void;
};

export const MobileWeekList = ({
  onDayPress,
  onSignOut,
  onAddActivity,
  onOpenAIPlanner,
  activeTab,
  onTabChange,
  activities,
  cancelledDates,
  onActivityClick,
  onImportGoogleCalendar,
  isImporting,
  importError,
  importSuccess,
  weekOffset,
  onWeekChange,
  viewMode,
  onToggleView,
}: MobileWeekListProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const getTabValue = (tab: 'calendar' | 'add' | 'ai') => {
    if (tab === 'calendar') return 0;
    if (tab === 'add') return 1;
    return 2;
  };

  const slideAnim = useRef(new Animated.Value(getTabValue(activeTab))).current;

  const SWIPE_THRESHOLD = screenWidth * 0.25;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10,
    onPanResponderMove: (_, gestureState) => {
      const currentValue = getTabValue(activeTab);
      const gestureProgress = -gestureState.dx / screenWidth;
      const newValue = Math.max(0, Math.min(2, currentValue + gestureProgress));
      slideAnim.setValue(newValue);
    },
    onPanResponderRelease: (_, gestureState) => {
      const currentValue = getTabValue(activeTab);

      if (gestureState.dx < -SWIPE_THRESHOLD) {
        if (activeTab === 'calendar') {
          onTabChange('add');
        } else if (activeTab === 'add') {
          onTabChange('ai');
        }
      } else if (gestureState.dx > SWIPE_THRESHOLD) {
        if (activeTab === 'ai') {
          onTabChange('add');
        } else if (activeTab === 'add') {
          onTabChange('calendar');
        }
      } else {
        Animated.spring(slideAnim, {
          toValue: currentValue,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    },
  });

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: getTabValue(activeTab),
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [activeTab, slideAnim]);

  const calendarTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, -screenWidth, -screenWidth * 2],
  });

  const addTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [screenWidth, 0, -screenWidth],
  });

  const aiTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [screenWidth * 2, screenWidth, 0],
  });

  const headerColor = colors.background === '#0f172a' ? '#0a1121' : '#e2e8f0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerWithNav}>
        <View style={[styles.header, { backgroundColor: headerColor }]}>
          <View style={styles.headerContent}>
            <View style={styles.weekNavContainer}>
              <Pressable
                style={styles.weekNavButtonMobile}
                onPress={() => onWeekChange(weekOffset - 1)}
              >
                <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => weekOffset !== 0 && onWeekChange(0)}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  {getWeekDateRange(weekOffset)}
                </Text>
              </Pressable>
              <Pressable
                style={styles.weekNavButtonMobile}
                onPress={() => onWeekChange(weekOffset + 1)}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Pressable>
              {weekOffset !== 0 && (
                <Pressable
                  style={[styles.todayButtonMobile, { backgroundColor: colors.primary }]}
                  onPress={() => onWeekChange(0)}
                >
                  <Text style={styles.todayButtonMobileText}>Today</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.mobileViewToggle, { backgroundColor: colors.inputBackground }]}
                onPress={onToggleView}
              >
                <Ionicons
                  name={viewMode === 'weekly' ? 'calendar-outline' : 'grid-outline'}
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
            {onSignOut && <LogoutButton onPress={onSignOut} isMobile={true} colors={colors} />}
          </View>
        </View>

        <View style={styles.navNotchContainer}>
          <View style={[styles.navNotchCurve, { backgroundColor: headerColor }]}>
            <Pressable style={styles.navNotchButton} onPress={() => onTabChange('calendar')}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={activeTab === 'calendar' ? colors.primary : colors.textSecondary}
              />
            </Pressable>
            <Pressable
              style={styles.navNotchButton}
              onPress={() => {
                onTabChange('add');
                onAddActivity?.();
              }}
            >
              <Ionicons
                name="add"
                size={22}
                color={activeTab === 'add' ? colors.primary : colors.textSecondary}
              />
            </Pressable>
            {onOpenAIPlanner && (
              <Pressable style={styles.navNotchButton} onPress={() => onTabChange('ai')}>
                <Ionicons
                  name="sparkles"
                  size={20}
                  color={activeTab === 'ai' ? colors.primary : colors.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <View style={styles.slidingContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[styles.slidingView, { transform: [{ translateX: calendarTranslateX }] }]}
        >
          <View style={styles.mobileListFull}>
            {dayOrder.map((day, index) => {
              const isToday = isDayToday(index, weekOffset);
              const isLast = index === dayOrder.length - 1;
              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayRowTimeline,
                    {
                      backgroundColor: colors.card,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: colors.border,
                    },
                    isToday && { backgroundColor: colors.primary + '08' },
                  ]}
                  onPress={() => onDayPress(day)}
                >
                  <View style={styles.dayLabelSection}>
                    <Text
                      style={[
                        styles.dayLabelText,
                        { color: isToday ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {dayNames[day]}
                    </Text>
                    {isToday && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
                  </View>

                  <View style={[styles.timelineBar, { backgroundColor: colors.inputBackground }]}>
                    {getActivitiesForDay(activities, day, weekOffset, cancelledDates).map((a) => {
                      const startMinutes = parseTime(a.startTime);
                      const endMinutes = parseTime(a.endTime);
                      if (startMinutes === null || endMinutes === null) return null;

                      const isOvernight = endMinutes < startMinutes;
                      const TIMELINE_START = 0;
                      const TIMELINE_END = 24 * 60;
                      const TIMELINE_DURATION = TIMELINE_END - TIMELINE_START;
                      const displayEndMinutes = isOvernight ? TIMELINE_END : endMinutes;

                      const leftPercent = Math.max(
                        0,
                        ((startMinutes - TIMELINE_START) / TIMELINE_DURATION) * 100,
                      );
                      const widthPercent = Math.min(
                        100 - leftPercent,
                        ((displayEndMinutes - startMinutes) / TIMELINE_DURATION) * 100,
                      );

                      return (
                        <View
                          key={a.id}
                          style={[
                            styles.timelineActivityPositioned,
                            {
                              backgroundColor: a.color,
                              left: `${leftPercent}%`,
                              width: `${Math.max(widthPercent, 3)}%`,
                            },
                          ]}
                        />
                      );
                    })}
                    {index > 0 &&
                      (() => {
                        const prevDay = dayOrder[index - 1];
                        const prevDayActivities = getActivitiesForDay(
                          activities,
                          prevDay,
                          weekOffset,
                          cancelledDates,
                        );
                        const TIMELINE_START_CONT = 0;
                        const TIMELINE_END_CONT = 24 * 60;
                        const TIMELINE_DURATION_CONT = TIMELINE_END_CONT - TIMELINE_START_CONT;

                        return prevDayActivities.map((a) => {
                          const startMinutes = parseTime(a.startTime);
                          const endMinutes = parseTime(a.endTime);
                          if (startMinutes === null || endMinutes === null) return null;
                          if (endMinutes >= startMinutes) return null;

                          const leftPercent = 0;
                          const widthPercent = (endMinutes / TIMELINE_DURATION_CONT) * 100;

                          return (
                            <View
                              key={`${a.id}-continuation`}
                              style={[
                                styles.timelineActivityPositioned,
                                {
                                  backgroundColor: a.color,
                                  opacity: 0.7,
                                  left: `${leftPercent}%`,
                                  width: `${Math.max(widthPercent, 3)}%`,
                                },
                              ]}
                            />
                          );
                        });
                      })()}
                  </View>

                  <View style={styles.chevronSection}>
                    <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingView,
            styles.slidingViewAbsolute,
            { transform: [{ translateX: addTranslateX }] },
          ]}
        >
          <View style={[styles.addActivityView, { backgroundColor: colors.background }]}>
            <View style={styles.mobileActionButtons}>
              <Pressable
                style={[styles.newActivityButtonTop, { backgroundColor: colors.primary }]}
                onPress={onAddActivity}
              >
                <Ionicons name="add-circle" size={22} color="#ffffff" />
                <Text style={styles.newActivityButtonTopText}>New Activity</Text>
              </Pressable>

              {onImportGoogleCalendar && (
                <Pressable
                  style={[
                    styles.importCalendarButtonMobile,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: isImporting ? 0.6 : 1,
                    },
                  ]}
                  onPress={onImportGoogleCalendar}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <Ionicons name="sync" size={20} color="#4285F4" />
                  ) : (
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                  )}
                  <Text style={[styles.importCalendarButtonMobileText, { color: colors.textPrimary }]}>
                    {isImporting ? 'Importing...' : 'Import from Google'}
                  </Text>
                </Pressable>
              )}
            </View>

            {importError && (
              <View style={[styles.importMessageMobile, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={[styles.importMessageMobileText, { color: '#DC2626' }]}>{importError}</Text>
              </View>
            )}
            {importSuccess !== null && importSuccess !== undefined && (
              <View style={[styles.importMessageMobile, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={[styles.importMessageMobileText, { color: '#059669' }]}>
                  {importSuccess === 0
                    ? 'No events to import'
                    : `Imported ${importSuccess} event${importSuccess > 1 ? 's' : ''}`}
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.activitiesListScroll}
              contentContainerStyle={styles.activitiesListContent}
              showsVerticalScrollIndicator={false}
            >
              {activities.length === 0 ? (
                <View style={styles.emptyActivitiesList}>
                  <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                  <Text style={[styles.emptyActivitiesTitle, { color: colors.textSecondary }]}>
                    No activities yet
                  </Text>
                  <Text style={[styles.emptyActivitiesSubtitle, { color: colors.placeholder }]}>
                    Tap the button above to create one
                  </Text>
                </View>
              ) : (
                activities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    style={[styles.activityListItem, { backgroundColor: colors.card }]}
                    onPress={() => onActivityClick?.(activity)}
                  >
                    <View style={[styles.activityListColorBar, { backgroundColor: activity.color }]} />
                    <View style={styles.activityListInfo}>
                      <Text style={[styles.activityListName, { color: colors.textPrimary }]}>
                        {activity.name}
                      </Text>
                      <View style={styles.activityListMeta}>
                        <Text style={[styles.activityListDay, { color: colors.textSecondary }]}>
                          {dayNames[activity.day]}
                        </Text>
                        <Text style={[styles.activityListTime, { color: colors.placeholder }]}>
                          {activity.startTime} - {activity.endTime}
                        </Text>
                        {activity.isRecurring && (
                          <View style={styles.activityListRecurring}>
                            <Ionicons name="repeat" size={12} color={colors.primary} />
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>

        {onOpenAIPlanner && (
          <Animated.View
            style={[
              styles.slidingView,
              styles.slidingViewAbsolute,
              { transform: [{ translateX: aiTranslateX }] },
            ]}
          >
            <View style={[styles.addActivityView, { backgroundColor: colors.background }]}>
              <ScrollView
                style={styles.activitiesListScroll}
                contentContainerStyle={styles.activitiesListContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.aiHelperContent}>
                  <View style={[styles.aiHelperHeader, { backgroundColor: colors.card }]}>
                    <Ionicons name="sparkles" size={32} color={colors.primary} />
                    <Text style={[styles.aiHelperTitle, { color: colors.textPrimary }]}>
                      AI Schedule Planner
                    </Text>
                    <Text style={[styles.aiHelperSubtitle, { color: colors.textSecondary }]}>
                      Describe your schedule for this week and let AI generate it for you
                    </Text>
                  </View>

                  <Pressable
                    style={[styles.aiHelperButtonMobileFull, { backgroundColor: colors.primary }]}
                    onPress={onOpenAIPlanner}
                  >
                    <Ionicons name="sparkles" size={22} color="#ffffff" />
                    <Text style={styles.aiHelperButtonMobileFullText}>Open AI Planner</Text>
                  </Pressable>

                  <View style={[styles.aiHelperInfo, { backgroundColor: colors.card }]}>
                    <Ionicons name="information-circle" size={20} color={colors.primary} />
                    <Text style={[styles.aiHelperInfoText, { color: colors.textSecondary }]}>
                      The AI will respect your existing recurring activities and generate new ones based on your request.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};
