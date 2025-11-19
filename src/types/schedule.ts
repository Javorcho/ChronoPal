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

export type ActivityId = string;

export type Activity = {
  id: ActivityId;
  name: string;
  color: string;
  day: DayOfWeek;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isRecurring: boolean;
  recurrence?: RecurrenceType;
  createdAt: number;
  updatedAt: number;
};

export type ActivityInput = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>;

