import { Activity, DayOfWeek, RecurrenceType } from '@/types/schedule';

const palette = ['#f76e6e', '#fdbf4e', '#58c9b9', '#7f78d2', '#ffa5ab'];

const sampleNames = [
  { name: 'Deep Work', duration: 90 },
  { name: 'Workout', duration: 60 },
  { name: 'Reading', duration: 45 },
  { name: 'Focus Block', duration: 120 },
  { name: 'Planning', duration: 30 },
  { name: 'Study Session', duration: 75 },
  { name: 'Catch-up', duration: 50 },
];

const toTime = (baseHour: number, minutes: number) => {
  const hour = Math.floor(baseHour + minutes / 60);
  const mins = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const getMockActivities = (userId = 'demo-user'): Activity[] => {
  const now = Date.now();

  return sampleNames.map((item, index) => {
    const day = Object.values(DayOfWeek)[index % 7];
    const startMinutes = 8 * 60 + index * 30;
    const endMinutes = startMinutes + item.duration;

    return {
      id: `${day}-${index}`,
      userId,
      name: item.name,
      color: palette[index % palette.length],
      day,
      startTime: toTime(0, startMinutes),
      endTime: toTime(0, endMinutes),
      isRecurring: index % 2 === 0,
      recurrence: index % 2 === 0 ? RecurrenceType.Weekly : RecurrenceType.None,
      notes: null,
      createdAt: now - index * 1000,
      updatedAt: now - index * 1000,
    };
  });
};

