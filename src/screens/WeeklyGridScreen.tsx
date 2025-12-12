import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTheme } from '@/store/useThemeStore';
import { dayNames, DayOfWeek, dayOrder } from '@/types/schedule';

// Breakpoint for mobile vs desktop
const MOBILE_BREAKPOINT = 768;

type WeeklyGridScreenProps = {
  onSignOut?: () => void;
};

export const WeeklyGridScreen = ({ onSignOut }: WeeklyGridScreenProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < MOBILE_BREAKPOINT;

  // Selected day for mobile expanded view
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);

  // Get current day
  const today = new Date();
  const dayIndex = today.getDay();
  const currentDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const currentDay = dayOrder[currentDayIndex];

  // Handle day press
  const handleDayPress = (day: DayOfWeek) => {
    if (isMobile) {
      setSelectedDay(day);
    }
  };

  // Handle back from expanded view
  const handleBack = () => {
    setSelectedDay(null);
  };

  // Mobile expanded single day view
  if (isMobile && selectedDay) {
    return (
      <MobileDayExpanded
        day={selectedDay}
        isToday={selectedDay === currentDay}
        onBack={handleBack}
        onSignOut={onSignOut}
      />
    );
  }

  // Mobile compact list view
  if (isMobile) {
    return (
      <MobileWeekList
        currentDay={currentDay}
        onDayPress={handleDayPress}
        onSignOut={onSignOut}
      />
    );
  }

  // Desktop horizontal grid
  return (
    <DesktopWeekGrid
      currentDay={currentDay}
      onSignOut={onSignOut}
    />
  );
};

// ===========================================
// MOBILE: Compact List View (days as rows)
// ===========================================
type MobileWeekListProps = {
  currentDay: DayOfWeek;
  onDayPress: (day: DayOfWeek) => void;
  onSignOut?: () => void;
};

const MobileWeekList = ({ currentDay, onDayPress, onSignOut }: MobileWeekListProps) => {
  const { colors } = useTheme();

  const FULL_DAY_NAMES: Record<DayOfWeek, string> = {
    [DayOfWeek.Monday]: 'Monday',
    [DayOfWeek.Tuesday]: 'Tuesday',
    [DayOfWeek.Wednesday]: 'Wednesday',
    [DayOfWeek.Thursday]: 'Thursday',
    [DayOfWeek.Friday]: 'Friday',
    [DayOfWeek.Saturday]: 'Saturday',
    [DayOfWeek.Sunday]: 'Sunday',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Weekly Schedule
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Tap a day to view details
            </Text>
          </View>
          {onSignOut && (
            <Pressable
              style={[styles.signOutButton, { backgroundColor: colors.inputBackground }]}
              onPress={onSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Days List */}
      <ScrollView
        style={styles.mobileList}
        contentContainerStyle={styles.mobileListContent}
        showsVerticalScrollIndicator={false}
      >
        {dayOrder.map((day) => {
          const isToday = day === currentDay;
          return (
            <Pressable
              key={day}
              style={[
                styles.dayRow,
                { backgroundColor: colors.card },
                isToday && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => onDayPress(day)}
            >
              <View style={styles.dayRowLeft}>
                <View
                  style={[
                    styles.dayIconContainer,
                    { backgroundColor: isToday ? colors.primary : colors.inputBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayIconText,
                      { color: isToday ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {dayNames[day]}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.dayRowTitle, { color: colors.textPrimary }]}>
                    {FULL_DAY_NAMES[day]}
                  </Text>
                  <Text style={[styles.dayRowSubtitle, { color: colors.textSecondary }]}>
                    {isToday ? 'Today' : 'No activities'}
                  </Text>
                </View>
              </View>
              <View style={styles.dayRowRight}>
                <View style={[styles.activityCount, { backgroundColor: colors.inputBackground }]}>
                  <Text style={[styles.activityCountText, { color: colors.textSecondary }]}>
                    0
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom Stats */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0h</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Week</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recurring</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="today-outline" size={18} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
        </View>
      </View>
    </View>
  );
};

// ===========================================
// MOBILE: Expanded Single Day View (column)
// ===========================================
type MobileDayExpandedProps = {
  day: DayOfWeek;
  isToday: boolean;
  onBack: () => void;
  onSignOut?: () => void;
};

const MobileDayExpanded = ({ day, isToday, onBack }: MobileDayExpandedProps) => {
  const { colors } = useTheme();

  const FULL_DAY_NAMES: Record<DayOfWeek, string> = {
    [DayOfWeek.Monday]: 'Monday',
    [DayOfWeek.Tuesday]: 'Tuesday',
    [DayOfWeek.Wednesday]: 'Wednesday',
    [DayOfWeek.Thursday]: 'Thursday',
    [DayOfWeek.Friday]: 'Friday',
    [DayOfWeek.Saturday]: 'Saturday',
    [DayOfWeek.Sunday]: 'Sunday',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
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

      {/* Day Column Content */}
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
          {/* Day Header */}
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

          {/* Activities Area */}
          <View style={styles.expandedActivitiesArea}>
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No activities
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                Activities will appear here
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Stats for this day */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Ionicons name="list-outline" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Activities</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0h</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Scheduled</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recurring</Text>
        </View>
      </View>
    </View>
  );
};

// ===========================================
// DESKTOP: Horizontal Grid (columns)
// ===========================================
type DesktopWeekGridProps = {
  currentDay: DayOfWeek;
  onSignOut?: () => void;
};

const DesktopWeekGrid = ({ currentDay, onSignOut }: DesktopWeekGridProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const DAY_COLUMN_WIDTH = Math.max((screenWidth - 80) / 7, 120);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Weekly Schedule
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Plan your week
            </Text>
          </View>
          {onSignOut && (
            <Pressable
              style={[styles.signOutButton, { backgroundColor: colors.inputBackground }]}
              onPress={onSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Week Grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
      >
        {dayOrder.map((day) => {
          const isToday = day === currentDay;
          return (
            <View
              key={day}
              style={[
                styles.dayColumn,
                { backgroundColor: colors.card, width: DAY_COLUMN_WIDTH },
                isToday && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              {/* Day Header */}
              <View
                style={[
                  styles.dayHeader,
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

              {/* Empty Content Area */}
              <View style={styles.dayContent}>
                <View style={styles.emptyDaySmall}>
                  <Ionicons name="calendar-outline" size={24} color={colors.placeholder} />
                  <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                    No activities
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Stats */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0h</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This week</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recurring</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="today-outline" size={18} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
        </View>
      </View>
    </View>
  );
};

// ===========================================
// STYLES
// ===========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mobile List View
  mobileList: {
    flex: 1,
  },
  mobileListContent: {
    padding: 16,
    gap: 12,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dayRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dayIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayRowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayRowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  dayRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activityCountText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Mobile Expanded View
  expandedContent: {
    flex: 1,
  },
  expandedContentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  expandedDayColumn: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  expandedDayHeader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  expandedDayName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  expandedActivitiesArea: {
    flex: 1,
    padding: 16,
    minHeight: 300,
  },
  emptyDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
  },
  todayBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Desktop Grid
  gridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  dayColumn: {
    minHeight: 300,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dayHeader: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  emptyDaySmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
});
