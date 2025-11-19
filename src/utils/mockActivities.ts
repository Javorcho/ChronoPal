import { Activity, DayOfWeek } from '@/types/schedule';

const palette = ['#f76e6e', '#fdbf4e', '#58c9b9', '#7f78d2', '#ffa5ab'];

const sampleNames = [
  'Deep Work',
  'Workout',
  'Reading',
  'Focus Block',
  'Meetup',
  'Planning',
  'Study',
];

export const getMockActivities = (): Activity[] => {
  const result: Activity[] = [];

  sampleNames.forEach((name, index) => {
    const dayIndex = index % 5;
    result.push({
      id: `${dayIndex}-${index}`,
      name,
      color: palette[index % palette.length],
      day: Object.values(DayOfWeek)[dayIndex],
      startTime: `${8 + index}:00`,
      endTime: `${9 + index}:00`,
      isRecurring: false,
      createdAt: Date.now() - index * 1000,
      updatedAt: Date.now() - index * 1000,
    });
  });

  return result;
};

