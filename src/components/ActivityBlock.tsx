import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Activity } from '@/types/schedule';

type ActivityBlockProps = {
  activity: Activity;
  onPress?: (activity: Activity) => void;
  compact?: boolean;
  showTime?: boolean;
};

export const ActivityBlock = memo(
  ({ activity, onPress, compact = false, showTime = true }: ActivityBlockProps) => {
    const [isHovered, setIsHovered] = useState(false);

    // Calculate duration in minutes
    const [startH, startM] = activity.startTime.split(':').map(Number);
    const [endH, endM] = activity.endTime.split(':').map(Number);
    const durationMins = endH * 60 + endM - (startH * 60 + startM);
    const durationText =
      durationMins >= 60
        ? `${Math.floor(durationMins / 60)}h ${durationMins % 60 > 0 ? `${durationMins % 60}m` : ''}`
        : `${durationMins}m`;

    // Darken color for hover
    const adjustColor = (color: string, amount: number) => {
      const hex = color.replace('#', '');
      const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
      const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
      const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
      return `rgb(${r}, ${g}, ${b})`;
    };

    return (
      <Pressable
        style={[
          compact ? styles.blockCompact : styles.block,
          {
            backgroundColor: isHovered
              ? adjustColor(activity.color, -20)
              : activity.color,
          },
        ]}
        onPress={() => onPress?.(activity)}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        accessibilityRole="button"
        accessibilityLabel={`${activity.name} block`}
      >
        <Text style={compact ? styles.labelCompact : styles.label} numberOfLines={compact ? 1 : 2}>
          {activity.name}
        </Text>
        {showTime && (
          <View style={styles.timeRow}>
            <Text style={compact ? styles.timeCompact : styles.time}>
              {activity.startTime} - {activity.endTime}
            </Text>
            {!compact && (
              <Text style={styles.duration}>{durationText}</Text>
            )}
          </View>
        )}
        {activity.isRecurring && (
          <View style={styles.recurringBadge}>
            <Ionicons name="repeat" size={compact ? 10 : 12} color="rgba(255,255,255,0.8)" />
          </View>
        )}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  block: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 72,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  } as ViewStyle,
  blockCompact: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  } as ViewStyle,
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 4,
  },
  labelCompact: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  timeCompact: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  duration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  recurringBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});

