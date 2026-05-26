import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Activity, DayOfWeek, dayOrder } from '@/types/schedule';

const STORAGE_KEY = 'chronopal_activity_notifications';
export const DEFAULT_LEAD_MINUTES = 15;

type NotificationMap = Record<string, string>;

let configured = false;
let permissionGranted: boolean | null = null;

/**
 * One-time setup: registers the foreground handler and (on Android) the
 * notification channel. Safe to call multiple times.
 */
export const setupNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web' || configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'ChronoPal reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    } catch (e) {
      console.warn('Failed to set Android notification channel:', e);
    }
  }
};

/**
 * Ensures the OS-level permission is granted. Result is cached for the session.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    permissionGranted = false;
    return false;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted' && existing.canAskAgain !== false) {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    permissionGranted = status === 'granted';
    return permissionGranted;
  } catch (e) {
    console.warn('Failed to request notification permissions:', e);
    permissionGranted = false;
    return false;
  }
};

const readMap = async (): Promise<NotificationMap> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotificationMap) : {};
  } catch {
    return {};
  }
};

const writeMap = async (map: NotificationMap): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to write notification map:', e);
  }
};

const parseHourMinute = (
  value: string,
): { hour: number; minute: number } | null => {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
};

// expo-notifications weekly trigger uses 1=Sunday ... 7=Saturday
const dayOfWeekToWeeklyTrigger = (day: DayOfWeek): number => {
  switch (day) {
    case DayOfWeek.Sunday:
      return 1;
    case DayOfWeek.Monday:
      return 2;
    case DayOfWeek.Tuesday:
      return 3;
    case DayOfWeek.Wednesday:
      return 4;
    case DayOfWeek.Thursday:
      return 5;
    case DayOfWeek.Friday:
      return 6;
    case DayOfWeek.Saturday:
      return 7;
  }
};

const previousDay = (day: DayOfWeek): DayOfWeek => {
  const idx = dayOrder.indexOf(day);
  return dayOrder[(idx - 1 + 7) % 7];
};

const leadLabel = (minutes: number): string => {
  if (minutes <= 0) return 'now';
  if (minutes < 60) return `in ${minutes} min`;
  if (minutes === 60) return 'in 1 hour';
  if (minutes % 60 === 0) return `in ${minutes / 60} hours`;
  return `in ${minutes} min`;
};

export type ScheduleOpts = {
  leadMinutes?: number;
};

/**
 * Schedules a local reminder for the given activity. Cancels any previously
 * scheduled notification for the same activity first.
 *
 * - Recurring activities → weekly repeating trigger.
 * - One-time activities → single date trigger (skipped if already past).
 *
 * Returns the scheduled notification id, or `null` if nothing was scheduled
 * (no permission, web, invalid time, or already in the past).
 */
export const scheduleActivityNotification = async (
  activity: Activity,
  opts: ScheduleOpts = {},
): Promise<string | null> => {
  if (Platform.OS === 'web') return null;

  await cancelActivityNotification(activity.id);

  if (permissionGranted === false) return null;
  if (permissionGranted === null) {
    const granted = await requestNotificationPermissions();
    if (!granted) return null;
  }

  const leadMinutes = opts.leadMinutes ?? DEFAULT_LEAD_MINUTES;
  const startHM = parseHourMinute(activity.startTime);
  if (!startHM) return null;

  const content: Notifications.NotificationContentInput = {
    title: activity.name || 'Upcoming activity',
    body: `Starts ${leadLabel(leadMinutes)} at ${activity.startTime}${
      activity.location ? ` • ${activity.location}` : ''
    }`,
    data: { activityId: activity.id },
    sound: 'default',
  };

  try {
    let notificationId: string | null = null;

    if (activity.isRecurring) {
      let totalMinutes = startHM.hour * 60 + startHM.minute - leadMinutes;
      let weekday = activity.day;
      if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
        weekday = previousDay(weekday);
      }
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;

      notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: dayOfWeekToWeeklyTrigger(weekday),
          hour,
          minute,
        },
      });
    } else {
      if (!activity.activityDate) return null;
      const [y, mo, d] = activity.activityDate.split('-').map(Number);
      if (!y || !mo || !d) return null;

      const startDate = new Date(y, mo - 1, d, startHM.hour, startHM.minute, 0, 0);
      const triggerDate = new Date(startDate.getTime() - leadMinutes * 60 * 1000);
      if (triggerDate.getTime() <= Date.now()) return null;

      notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
    }

    if (notificationId) {
      const map = await readMap();
      map[activity.id] = notificationId;
      await writeMap(map);
    }
    return notificationId;
  } catch (e) {
    console.warn(`Failed to schedule notification for ${activity.id}:`, e);
    return null;
  }
};

/**
 * Cancels the local notification associated with `activityId` (if any).
 */
export const cancelActivityNotification = async (activityId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  const map = await readMap();
  const id = map[activityId];
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Notification may have already fired or been cancelled; ignore.
  }
  delete map[activityId];
  await writeMap(map);
};

/**
 * Re-schedules notifications for the given activities, replacing all existing
 * scheduled notifications. Use on initial activity load / after sign-in to
 * recover state when the device may have missed prior scheduling.
 */
export const rescheduleAllActivityNotifications = async (
  activities: Activity[],
  opts: ScheduleOpts = {},
): Promise<void> => {
  if (Platform.OS === 'web') return;
  await cancelAllActivityNotifications();
  for (const activity of activities) {
    await scheduleActivityNotification(activity, opts);
  }
};

/**
 * Removes every scheduled local notification (e.g. on sign-out).
 */
export const cancelAllActivityNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Failed to cancel all notifications:', e);
  }
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
