// Activity colors palette
export const ACTIVITY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

// Breakpoint for mobile vs desktop
export const MOBILE_BREAKPOINT = 768;

// Generate time slots from 12am to 11pm (full 24 hours)
export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { hour, label: `${displayHour} ${ampm}` };
});

// Height of each hour slot in pixels (desktop grid)
export const HOUR_HEIGHT = 50;
