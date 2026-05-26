import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type MiniCalendarPickerProps = {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  monthOffset: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  colors: any;
};

export const MiniCalendarPicker = ({
  selectedDate,
  onSelectDate,
  monthOffset,
  onPrevMonth,
  onNextMonth,
  colors,
}: MiniCalendarPickerProps) => {
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDay = firstDayOfMonth.getDay();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    currentWeek.push(date);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <View style={miniCalStyles.container}>
      <View style={miniCalStyles.header}>
        <Pressable onPress={onPrevMonth} style={miniCalStyles.navButton}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={[miniCalStyles.monthText, { color: colors.textPrimary }]}>{monthName}</Text>
        <Pressable onPress={onNextMonth} style={miniCalStyles.navButton}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={miniCalStyles.dayNamesRow}>
        {dayNames.map((day, idx) => (
          <Text key={idx} style={[miniCalStyles.dayName, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIdx) => (
        <View key={weekIdx} style={miniCalStyles.weekRow}>
          {week.map((date, dayIdx) => (
            <Pressable
              key={dayIdx}
              style={[
                miniCalStyles.dayCell,
                date && { backgroundColor: colors.inputBackground },
                isToday(date) && { borderColor: colors.primary, borderWidth: 1 },
                isSelected(date) && { backgroundColor: colors.primary },
              ]}
              onPress={() => date && onSelectDate(date)}
              disabled={!date}
            >
              <Text
                style={[
                  miniCalStyles.dayText,
                  { color: colors.textSecondary },
                  isToday(date) && { color: colors.primary, fontWeight: '600' },
                  isSelected(date) && { color: '#ffffff', fontWeight: '600' },
                ]}
              >
                {date?.getDate() || ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}

      {selectedDate && (
        <View style={[miniCalStyles.selectedDisplay, { backgroundColor: colors.inputBackground }]}>
          <Text style={[miniCalStyles.selectedText, { color: colors.textPrimary }]}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

const miniCalStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navButton: {
    padding: 4,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    width: 32,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 2,
  },
  dayCell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 13,
  },
  selectedDisplay: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
