export enum DayOfWeek {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
}

export const dayOrder: DayOfWeek[] = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
  DayOfWeek.Sunday,
];

export enum RecurrenceType {
  None = 'none',
  Daily = 'daily',
  Weekly = 'weekly',
  Biweekly = 'biweekly',
  Monthly = 'monthly',
  Yearly = 'yearly',
  Custom = 'custom',
}

export enum ActivityStatus {
  Scheduled = 'scheduled',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum ActivitySource {
  Manual = 'manual',
  Google = 'google',
  Microsoft = 'microsoft',
  Apple = 'apple',
}

export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum ReminderType {
  Notification = 'notification',
  Email = 'email',
  Push = 'push',
}

export const dayNames: Record<DayOfWeek, string> = {
  [DayOfWeek.Monday]: 'Mon',
  [DayOfWeek.Tuesday]: 'Tue',
  [DayOfWeek.Wednesday]: 'Wed',
  [DayOfWeek.Thursday]: 'Thu',
  [DayOfWeek.Friday]: 'Fri',
  [DayOfWeek.Saturday]: 'Sat',
  [DayOfWeek.Sunday]: 'Sun',
};

export const dayFullNames: Record<DayOfWeek, string> = {
  [DayOfWeek.Monday]: 'Monday',
  [DayOfWeek.Tuesday]: 'Tuesday',
  [DayOfWeek.Wednesday]: 'Wednesday',
  [DayOfWeek.Thursday]: 'Thursday',
  [DayOfWeek.Friday]: 'Friday',
  [DayOfWeek.Saturday]: 'Saturday',
  [DayOfWeek.Sunday]: 'Sunday',
};

// ============================================
// CATEGORY TYPES
// ============================================
export type CategoryId = string;

export type Category = {
  id: CategoryId;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: number;
  updatedAt: number;
};

export type CategoryInput = {
  userId: string;
  name: string;
  color: string;
  icon?: string;
};

export type CategoryUpdate = Partial<Omit<CategoryInput, 'userId'>>;

// ============================================
// ACTIVITY TYPES
// ============================================
export type ActivityId = string;

export type ActivityBase = {
  name: string;
  color: string;
  day: DayOfWeek; // Legacy: day of week (for backwards compatibility)
  activityDate?: string; // New: specific date (YYYY-MM-DD format)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  
  // Recurrence
  isRecurring: boolean;
  recurrence?: RecurrenceType;
  recurrenceRule?: string; // RRULE format for complex patterns
  recurrenceEndDate?: string; // YYYY-MM-DD
  parentActivityId?: string; // For recurring instances
  
  // Organization
  categoryId?: string;
  status?: ActivityStatus;
  priority?: Priority;
  
  // Details
  description?: string;
  location?: string;
  notes?: string | null; // Legacy field
  
  // External calendar sync
  externalId?: string; // ID from Google/Microsoft calendar
  source?: ActivitySource;
  lastSyncedAt?: number;
  
  // Timezone
  timezone?: string;
};

export type Activity = ActivityBase & {
  id: ActivityId;
  userId: string;
  createdAt: number;
  updatedAt: number;
};

export type ActivityInput = Omit<ActivityBase, 'status' | 'source'> & {
  userId: string;
  status?: ActivityStatus;
  source?: ActivitySource;
};

export type ActivityUpdate = Partial<ActivityBase>;

// ============================================
// REMINDER TYPES
// ============================================
export type ReminderId = string;

export type Reminder = {
  id: ReminderId;
  activityId: ActivityId;
  userId: string;
  remindAt: number; // Unix timestamp
  type: ReminderType;
  message?: string;
  sent: boolean;
  sentAt?: number;
  createdAt: number;
};

export type ReminderInput = {
  activityId: ActivityId;
  userId: string;
  remindAt: number;
  type?: ReminderType;
  message?: string;
};

export type ReminderUpdate = Partial<Omit<ReminderInput, 'activityId' | 'userId'>>;

// ============================================
// ACTIVITY EXCEPTION TYPES (for recurring events)
// ============================================
export type ExceptionId = string;

export enum ExceptionType {
  Cancelled = 'cancelled',
  Modified = 'modified',
}

export type ActivityException = {
  id: ExceptionId;
  activityId: ActivityId;
  exceptionDate: string; // YYYY-MM-DD
  exceptionType: ExceptionType;
  createdAt: number;
};

export type ActivityExceptionInput = Omit<ActivityException, 'id' | 'createdAt'>;

// ============================================
// HELPER TYPES
// ============================================

// Activity with its category loaded
export type ActivityWithCategory = Activity & {
  category?: Category;
};

// For displaying activities in a specific date range
export type DateRangeQuery = {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  userId: string;
};

// Activity instance (for recurring events expanded to specific dates)
export type ActivityInstance = Activity & {
  instanceDate: string; // The specific date this instance represents
  isException?: boolean;
};

// ============================================
// DEFAULTS
// ============================================
export const defaultActivityColor = '#7f78d2';

export const defaultCategories: Omit<CategoryInput, 'userId'>[] = [
  { name: 'Work', color: '#3B82F6', icon: 'briefcase' },
  { name: 'Personal', color: '#8B5CF6', icon: 'person' },
  { name: 'Health', color: '#10B981', icon: 'fitness' },
  { name: 'Education', color: '#F59E0B', icon: 'school' },
  { name: 'Social', color: '#EC4899', icon: 'people' },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Convert day of week to date for a given week
export const dayToDate = (day: DayOfWeek, weekOffset: number = 0): Date => {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);
  
  const dayIndex = dayOrder.indexOf(day);
  const targetDate = new Date(monday);
  targetDate.setDate(monday.getDate() + dayIndex);
  
  return targetDate;
};

// Format date to YYYY-MM-DD
export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Parse YYYY-MM-DD to Date
export const parseISODate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Get day of week from date
export const dateToDayOfWeek = (date: Date): DayOfWeek => {
  const dayIndex = date.getDay();
  // Convert Sunday=0 to our Monday=0 format
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  return dayOrder[adjustedIndex];
};

// Check if two date strings are the same day
export const isSameDay = (date1: string, date2: string): boolean => {
  return date1 === date2;
};

// Get dates for a week given an offset from current week
export const getWeekDates = (weekOffset: number = 0): string[] => {
  return dayOrder.map(day => formatDateToISO(dayToDate(day, weekOffset)));
};