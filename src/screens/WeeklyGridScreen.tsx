import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/store/useThemeStore';
import { dayNames, DayOfWeek, dayOrder } from '@/types/schedule';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_COLUMN_WIDTH = Math.max((SCREEN_WIDTH - 48) / 7, 100);

type WeeklyGridScreenProps = {
  onDayPress?: (day: DayOfWeek) => void;
  onSignOut?: () => void;
};

export const WeeklyGridScreen = ({ onDayPress, onSignOut }: WeeklyGridScreenProps) => {
  const { colors } = useTheme();

  // Get current day
  const today = new Date();
  const dayIndex = today.getDay();
  // Convert Sunday=0 to our Monday=0 system
  const currentDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const currentDay = dayOrder[currentDayIndex];

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
            <Pressable
              key={day}
              style={[
                styles.dayColumn,
                { backgroundColor: colors.card },
                isToday && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => onDayPress?.(day)}
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
                <View style={styles.emptyDay}>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={colors.placeholder}
                  />
                  <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                    No activities
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom Stats Placeholder */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0h</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            This week
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Recurring
          </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  headerTitle: {
    fontSize: 28,
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
  gridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  dayColumn: {
    width: DAY_COLUMN_WIDTH,
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
  emptyDay: {
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
