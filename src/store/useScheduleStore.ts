import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { nanoid } from 'nanoid/non-secure';

import { Activity, ActivityInput, DayOfWeek, dayOrder } from '@/types/schedule';
import { getMockActivities } from '@/utils/mockActivities';

type ScheduleState = {
  activities: Activity[];
  selectedDay: DayOfWeek;
  loading: boolean;
  error?: string;
  initialize: () => void;
  selectDay: (day: DayOfWeek) => void;
  addActivity: (input: ActivityInput) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  removeActivity: (id: string) => void;
  clearError: () => void;
};

const initialActivities = getMockActivities();

export const useScheduleStore = create<ScheduleState>()(
  devtools((set) => ({
    activities: initialActivities,
    selectedDay: DayOfWeek.Monday,
    loading: false,
    error: undefined,
    initialize: () => {
      set(() => ({
        activities: initialActivities,
        loading: false,
      }));
    },
    selectDay: (day) =>
      set({
        selectedDay: day,
      }),
    addActivity: (input) =>
      set((state) => ({
        activities: [
          ...state.activities,
          {
            ...input,
            id: nanoid(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      })),
    updateActivity: (id, updates) =>
      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === id
            ? {
                ...activity,
                ...updates,
                updatedAt: Date.now(),
              }
            : activity,
        ),
      })),
    removeActivity: (id) =>
      set((state) => ({
        activities: state.activities.filter((activity) => activity.id !== id),
      })),
    clearError: () =>
      set(() => ({
        error: undefined,
      })),
  })),
);

export const useDayActivities = (day: DayOfWeek) =>
  useScheduleStore((state) =>
    state.activities
      .filter((activity) => activity.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  );

export const groupedActivities = (activities: Activity[]) =>
  dayOrder.map((day) => ({
    day,
    items: activities
      .filter((activity) => activity.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

