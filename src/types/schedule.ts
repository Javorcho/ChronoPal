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
  Weekly = 'weekly',
  Monthly = 'monthly',
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

export type ActivityId = string;

export type ActivityBase = {
  name: string;
  color: string;
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isRecurring: boolean;
  recurrence?: RecurrenceType;
  notes?: string | null;
};

export type Activity = ActivityBase & {
  id: ActivityId;
  userId: string;
  createdAt: number;
  updatedAt: number;
};

export type ActivityInput = ActivityBase & {
  userId: string;
};

export type ActivityUpdate = Partial<ActivityBase>;

export const defaultActivityColor = '#7f78d2';

