import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import {
  createActivity,
  fetchActivities,
  removeActivity as deleteActivity,
  subscribeToActivities,
  updateActivity as persistActivity,
} from '@/services/activityService';
import {
  Activity,
  ActivityId,
  ActivityInput,
  ActivityUpdate,
  DayOfWeek,
  dayOrder,
} from '@/types/schedule';
import { getMockActivities } from '@/utils/mockActivities';

type ScheduleState = {
  userId?: string;
  activities: Activity[];
  selectedDay: DayOfWeek;
  loading: boolean;
  hydrated: boolean;
  error?: string;
  initialize: (userId?: string) => Promise<void>;
  selectDay: (day: DayOfWeek) => void;
  addActivity: (input: Partial<ActivityInput>) => Promise<Activity | undefined>;
  updateActivity: (id: ActivityId, updates: ActivityUpdate) => Promise<void>;
  removeActivity: (id: ActivityId) => Promise<void>;
  clearError: () => void;
  reset: () => void;
};

const fallbackUserId = 'demo-user';

let unsubscribe: (() => void) | undefined;

export const useScheduleStore = create<ScheduleState>()(
  devtools((set, get) => ({
    userId: undefined,
    activities: getMockActivities(fallbackUserId),
    selectedDay: DayOfWeek.Monday,
    loading: false,
    hydrated: false,
    error: undefined,
    initialize: async (userId) => {
      const resolvedUserId = userId ?? fallbackUserId;
      set({ loading: true, userId: resolvedUserId });

      unsubscribe?.();
      unsubscribe = subscribeToActivities(resolvedUserId, (activities) =>
        set({
          activities,
          hydrated: true,
          loading: false,
        }),
      );

      try {
        const data = await fetchActivities(resolvedUserId);
        set({
          activities: data,
          loading: false,
          hydrated: true,
          error: undefined,
        });
      } catch (error) {
        console.warn('[useScheduleStore] Failed to fetch activities', error);
        set({
          activities: getMockActivities(resolvedUserId),
          loading: false,
          hydrated: true,
          error: (error as Error).message,
        });
      }
    },
    selectDay: (day) =>
      set({
        selectedDay: day,
      }),
    addActivity: async (input) => {
      const userId = input.userId ?? get().userId ?? fallbackUserId;
      const payload: ActivityInput = {
        name: input.name ?? 'Untitled',
        color: input.color ?? '#7f78d2',
        day: input.day ?? DayOfWeek.Monday,
        startTime: input.startTime ?? '09:00',
        endTime: input.endTime ?? '10:00',
        isRecurring: input.isRecurring ?? false,
        recurrence: input.recurrence,
        notes: input.notes ?? null,
        userId,
      };

      try {
        const created = await createActivity(payload);
        set((state) => ({
          activities: [...state.activities, created],
        }));
        return created;
      } catch (error) {
        set({ error: (error as Error).message });
        return undefined;
      }
    },
    updateActivity: async (id, updates) => {
      try {
        await persistActivity(id, updates);
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
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    removeActivity: async (id) => {
      try {
        await deleteActivity(id);
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id),
        }));
      } catch (error) {
        set({ error: (error as Error).message });
      }
    },
    clearError: () =>
      set(() => ({
        error: undefined,
      })),
    reset: () => {
      unsubscribe?.();
      unsubscribe = undefined;
      set({
        activities: [],
        loading: false,
        hydrated: false,
        userId: undefined,
      });
    },
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

