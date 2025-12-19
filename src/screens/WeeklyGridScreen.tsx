import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
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

// Inject custom scrollbar styles for web
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    [data-custom-scrollbar]::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    [data-custom-scrollbar]::-webkit-scrollbar-track {
      background: rgba(128, 128, 128, 0.1);
      border-radius: 4px;
      margin: 4px;
    }
    [data-custom-scrollbar]::-webkit-scrollbar-thumb {
      background: rgba(128, 128, 128, 0.35);
      border-radius: 4px;
    }
    [data-custom-scrollbar]::-webkit-scrollbar-thumb:hover {
      background: rgba(128, 128, 128, 0.5);
    }
    [data-custom-scrollbar] {
      scrollbar-width: thin;
      scrollbar-color: rgba(128, 128, 128, 0.35) rgba(128, 128, 128, 0.1);
    }
  `;
  document.head.appendChild(style);
}

// Hook to add custom scrollbar attribute to ScrollView on web
const useCustomScrollbar = () => {
  const scrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    if (Platform.OS === 'web' && scrollRef.current) {
      // @ts-ignore - accessing DOM node on web
      const node = scrollRef.current as unknown as HTMLElement;
      if (node && node.setAttribute) {
        node.setAttribute('data-custom-scrollbar', 'true');
      }
    }
  }, []);
  
  return scrollRef;
};

// Breakpoint for mobile vs desktop
const MOBILE_BREAKPOINT = 768;

// Logout button with hover effect for web, always red icon on mobile
type LogoutButtonProps = {
  onPress: () => void;
  isMobile: boolean;
  colors: any;
};

const LogoutButton = ({ onPress, isMobile, colors }: LogoutButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getIconColor = () => {
    if (isMobile) {
      return colors.error || '#EF4444'; // Red icon on mobile
    }
    // Desktop: red on hover, normal otherwise
    return isHovered ? (colors.error || '#EF4444') : colors.textSecondary;
  };

  return (
    <Pressable
      style={[styles.signOutButton, { backgroundColor: colors.inputBackground }]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons name="log-out-outline" size={20} color={getIconColor()} />
    </Pressable>
  );
};

// Get current week's date range (Monday to Sunday)
const getWeekDateRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Adjust so Monday = 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const formatDate = (date: Date) => `${months[date.getMonth()]} ${date.getDate()}`;
  
  // If same month, show "Dec 16 - 22, 2025"
  if (monday.getMonth() === sunday.getMonth()) {
    return `${formatDate(monday)} - ${sunday.getDate()}, ${sunday.getFullYear()}`;
  }
  // If different months, show "Dec 30 - Jan 5, 2025"
  return `${formatDate(monday)} - ${formatDate(sunday)}, ${sunday.getFullYear()}`;
};

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
              {getWeekDateRange()}
            </Text>
          </View>
          {onSignOut && (
            <LogoutButton onPress={onSignOut} isMobile={true} colors={colors} />
          )}
        </View>
      </View>

      {/* Days List */}
      <View style={styles.mobileListFull}>
        {dayOrder.map((day, index) => {
          const isToday = day === currentDay;
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
              {/* Day Label */}
              <View style={styles.dayLabelSection}>
                <Text
                  style={[
                    styles.dayLabelText,
                    { color: isToday ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {dayNames[day]}
                </Text>
                {isToday && (
                  <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                )}
              </View>

              {/* Timeline Bar */}
              <View style={[styles.timelineBar, { backgroundColor: colors.inputBackground }]}>
                {/* Empty timeline - activities will be rendered here later */}
              </View>

              {/* Chevron */}
              <View style={styles.chevronSection}>
                <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
              </View>
            </Pressable>
          );
        })}
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

// Generate time slots from 6am to 10pm
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return { hour, label: `${displayHour} ${ampm}` };
});

const HOUR_HEIGHT = 50; // Height of each hour slot in pixels

const DesktopWeekGrid = ({ currentDay, onSignOut }: DesktopWeekGridProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useCustomScrollbar();
  const TIME_GUTTER_WIDTH = 56;
  const GAP = 8;
  const PADDING = 16;
  const DAY_COLUMN_WIDTH = Math.max((screenWidth - TIME_GUTTER_WIDTH - PADDING * 2 - GAP * 6) / 7, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {getWeekDateRange()}
            </Text>
          </View>
          {onSignOut && (
            <LogoutButton onPress={onSignOut} isMobile={false} colors={colors} />
          )}
        </View>
      </View>

      {/* Time Grid with Day Columns */}
      <View style={styles.desktopGridWrapper}>
        {/* Time Gutter - for header alignment */}
        <View style={{ width: TIME_GUTTER_WIDTH }} />
        
        {/* Day Columns with Headers */}
        <View style={[styles.dayColumnsWrapper, { gap: GAP }]}>
          {dayOrder.map((day) => {
            const isToday = day === currentDay;
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
                {/* Day Header */}
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

      {/* Scrollable Time Grid */}
      <ScrollView
        ref={scrollRef}
        style={styles.desktopGridScroll}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.desktopGridRow}>
          {/* Time Labels Column */}
          <View style={[styles.timeGutter, { width: TIME_GUTTER_WIDTH }]}>
            {TIME_SLOTS.map((slot) => (
              <View key={slot.hour} style={[styles.timeGutterSlot, { height: HOUR_HEIGHT }]}>
                <Text style={[styles.timeGutterLabel, { color: colors.textSecondary }]}>
                  {slot.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Day Columns Grid */}
          <View style={[styles.dayColumnsWrapper, { gap: GAP }]}>
            {dayOrder.map((day) => {
              const isToday = day === currentDay;
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
  mobileListContentSmooth: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  mobileListFull: {
    flex: 1,
  },
  dayRowFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dayRowTimeline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  dayLabelSection: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  timelineBar: {
    flex: 1,
    height: '70%',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  chevronSection: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  dayRowSmooth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dayRowFirst: {
    // Full width, no rounding
  },
  dayRowLast: {
    // Full width, no rounding
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
  dayIconContainerSmooth: {
    width: 44,
    height: 44,
    borderRadius: 10,
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
  activityCountSmooth: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
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

  // Desktop Grid - Time Grid Layout
  desktopGridWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dayColumnsWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  desktopDayColumnFull: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  desktopDayHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  desktopGridScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  desktopGridRow: {
    flexDirection: 'row',
  },
  timeGutter: {
    paddingTop: 0,
  },
  timeGutterSlot: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timeGutterLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -7,
  },
  desktopDayColumnGrid: {
    // No border radius - connects to header above
  },
  desktopHourCell: {
    position: 'relative',
  },
  // Legacy styles (keeping for backwards compatibility)
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
  },
  timeSlotCell: {
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  timeSlotLabel: {
    fontSize: 9,
    fontWeight: '500',
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

