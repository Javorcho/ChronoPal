import { memo } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { Activity } from '@/types/schedule';

type ActivityBlockProps = {
  activity: Activity;
  onPress?: (activity: Activity) => void;
};

export const ActivityBlock = memo(({ activity, onPress }: ActivityBlockProps) => (
  <Pressable
    style={[styles.block, { backgroundColor: activity.color }]}
    onPress={() => onPress?.(activity)}
    accessibilityRole="button"
    accessibilityLabel={`${activity.name} block`}
  >
    <Text style={styles.label}>{activity.name}</Text>
  </Pressable>
));

const styles = StyleSheet.create({
  block: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
    minHeight: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  label: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

