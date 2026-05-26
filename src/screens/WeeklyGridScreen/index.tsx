import React, { useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import { ActivityAction } from '@/services/ai/plannerService';
import {
  CalendarReauthRequired,
  ensureGoogleCalendarToken,
} from '@/services/auth/authService';
import {
  clearExceptionsCache,
  createActivity,
  fetchExceptionsForDateRange,
  getActivitiesForDay,
  removeActivity,
  subscribeToActivities,
  updateActivity,
} from '@/services/database/activityService';
import {
  fetchGoogleCalendarEvents,
  splitCalendarEventIntoDaySegments,
} from '@/services/integrations/calendarService';
import {
  cancelActivityNotification,
  rescheduleAllActivityNotifications,
  scheduleActivityNotification,
} from '@/services/notifications/notificationService';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/store/useThemeStore';
import {
  Activity,
  ActivityInput,
  ActivityUpdate,
  DayOfWeek,
  dayOrder,
  dayToDate,
  formatDateToISO,
} from '@/types/schedule';

import { MOBILE_BREAKPOINT } from './constants';
import { AddActivityModal } from './modals/AddActivityModal';
import { AIPlannerModal } from './modals/AIPlannerModal';
import { EditActivityModal } from './modals/EditActivityModal';
import { parseTime } from './utils';
import { DesktopWeekGrid } from './views/DesktopWeekGrid';
import { MobileDayExpanded } from './views/MobileDayExpanded';
import { MobileWeekList } from './views/MobileWeekList';
import { MonthlyCalendarView } from './views/MonthlyCalendarView';
// Side-effect import to ensure the web scrollbar CSS is injected on web
import './webScrollbar';

type WeeklyGridScreenProps = {
  onSignOut?: () => void;
};

export const WeeklyGridScreen = ({ onSignOut }: WeeklyGridScreenProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < MOBILE_BREAKPOINT;
  const user = useAuthStore((state) => state.user);

  // Activities state (from Supabase)
  const [activities, setActivities] = useState<Activity[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [cancelledDates, setCancelledDates] = useState<Map<string, Set<string>>>(new Map());

  // UI state
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'calendar' | 'add' | 'ai'>('calendar');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showActivitiesPanel, setShowActivitiesPanel] = useState(false);

  // Google Calendar import state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  // Week / month navigation
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [monthOffset, setMonthOffset] = useState(0);

  // AI Planner
  const [showAIPlanner, setShowAIPlanner] = useState(false);

  // Re-sync local notifications with the loaded activities once per session
  const didInitialNotificationSync = useRef(false);

  // Subscribe to activities from Supabase and fetch exceptions
  useEffect(() => {
    if (!user?.uid) {
      setActivities([]);
      setIsLoading(false);
      didInitialNotificationSync.current = false;
      return;
    }

    setIsLoading(true);
    const loadExceptions = async (fetchedActivities: Activity[]) => {
      if (fetchedActivities.length > 0) {
        const weekDates = dayOrder.map((day) => formatDateToISO(dayToDate(day, weekOffset)));
        const activityIds = fetchedActivities.map((a) => a.id);
        const exceptions = await fetchExceptionsForDateRange(activityIds, weekDates[0], weekDates[6]);
        setCancelledDates(exceptions);
      } else {
        setCancelledDates(new Map());
      }
    };

    const unsubscribe = subscribeToActivities(user.uid, async (fetchedActivities) => {
      setActivities(fetchedActivities);
      await loadExceptions(fetchedActivities);
      setIsLoading(false);

      if (!didInitialNotificationSync.current) {
        didInitialNotificationSync.current = true;
        void rescheduleAllActivityNotifications(fetchedActivities);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid, weekOffset]);

  // Refresh exceptions when week changes
  useEffect(() => {
    if (activities.length > 0 && user?.uid) {
      const loadExceptions = async () => {
        const weekDates = dayOrder.map((day) => formatDateToISO(dayToDate(day, weekOffset)));
        const activityIds = activities.map((a) => a.id);
        const exceptions = await fetchExceptionsForDateRange(activityIds, weekDates[0], weekDates[6]);
        setCancelledDates(exceptions);
      };
      loadExceptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, activities.length]);

  // Clear import messages after a delay
  useEffect(() => {
    if (importSuccess !== null || importError) {
      const timer = setTimeout(() => {
        setImportSuccess(null);
        setImportError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess, importError]);

  // Current day for the today badge
  const today = new Date();
  const dayIndex = today.getDay();
  const currentDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const currentDay = dayOrder[currentDayIndex];

  // -------------------------------------------------------------------------
  // Time conflict detection (including overnight + previous-day overlap)
  // -------------------------------------------------------------------------
  const checkTimeConflict = (
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    weekOffsetToCheck?: number,
  ): string | null => {
    const newStart = parseTime(startTime);
    const newEnd = parseTime(endTime);
    if (newStart === null || newEnd === null) return null;

    const checkWeekOffset = weekOffsetToCheck !== undefined ? weekOffsetToCheck : weekOffset;
    const targetDate = formatDateToISO(dayToDate(day, checkWeekOffset));

    const dayActivities = activities.filter((a) => {
      if (a.day !== day) return false;
      if (a.isRecurring) return true;
      if (a.activityDate) return a.activityDate === targetDate;
      return false;
    });

    for (const existing of dayActivities) {
      const existingStart = parseTime(existing.startTime);
      const existingEnd = parseTime(existing.endTime);
      if (existingStart === null || existingEnd === null) continue;

      const existingIsOvernight = existingEnd < existingStart;
      const newIsOvernight = newEnd < newStart;

      if (existingIsOvernight) {
        if (newIsOvernight) {
          const existingEndAdjusted = existingEnd + 24 * 60;
          const newEndAdjusted = newEnd + 24 * 60;
          if (newStart < existingEndAdjusted && newEndAdjusted > existingStart) {
            return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
          }
        } else if (newStart < 24 * 60 && newEnd > existingStart) {
          return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
        }
      } else if (newIsOvernight) {
        if (newStart < existingEnd && 24 * 60 > existingStart) {
          return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
        }
      } else if (newStart < existingEnd && newEnd > existingStart) {
        return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
      }
    }

    // Also check overnight activities from the previous day that continue into this day
    const dayIdx = dayOrder.indexOf(day);
    const newIsOvernight = newEnd < newStart;

    if (dayIdx > 0) {
      const prevDay = dayOrder[dayIdx - 1];
      const prevDayDate = formatDateToISO(dayToDate(prevDay, checkWeekOffset));
      const prevDayActivities = activities.filter((a) => {
        if (a.day !== prevDay) return false;
        if (a.isRecurring) return true;
        if (a.activityDate) return a.activityDate === prevDayDate;
        return false;
      });

      for (const existing of prevDayActivities) {
        const existingStart = parseTime(existing.startTime);
        const existingEnd = parseTime(existing.endTime);
        if (existingStart === null || existingEnd === null) continue;

        if (existingEnd < existingStart) {
          if (newIsOvernight) {
            if (newEnd > 0 && newEnd < existingEnd) {
              return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
            }
          } else if (newStart < existingEnd) {
            return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
          }
        }
      }
    }

    return null;
  };

  // -------------------------------------------------------------------------
  // Activity handlers (create / update / delete) with optimistic UI updates
  // -------------------------------------------------------------------------
  const handleSaveActivity = async (activity: {
    name: string;
    day?: DayOfWeek;
    days?: DayOfWeek[];
    color: string;
    isRecurring: boolean;
    startTime: string;
    endTime: string;
    activityDate?: string;
    weekOffset?: number;
    recurrenceEndDate?: string;
    location?: string;
    description?: string;
  }): Promise<string | null> => {
    if (!user?.uid) return 'Not logged in';

    const daysToCreate = activity.days || (activity.day ? [activity.day] : []);
    if (daysToCreate.length === 0) {
      return 'Please select at least one day';
    }

    const activityWeekOffset = activity.weekOffset !== undefined ? activity.weekOffset : weekOffset;
    for (const day of daysToCreate) {
      const conflict = checkTimeConflict(day, activity.startTime, activity.endTime, activityWeekOffset);
      if (conflict) {
        return conflict;
      }
    }

    try {
      const created: Activity[] = [];
      for (const day of daysToCreate) {
        const dayWeekOffset = activity.weekOffset !== undefined ? activity.weekOffset : weekOffset;
        const activityDate =
          activity.activityDate ||
          (activity.isRecurring ? undefined : formatDateToISO(dayToDate(day, dayWeekOffset)));

        const newActivity = await createActivity({
          userId: user.uid,
          name: activity.name,
          day,
          activityDate,
          color: activity.color,
          isRecurring: activity.isRecurring,
          startTime: activity.startTime,
          endTime: activity.endTime,
          recurrenceEndDate: activity.isRecurring ? activity.recurrenceEndDate : undefined,
          location: activity.location,
          description: activity.description,
        });
        created.push(newActivity);
      }
      if (created.length > 0) {
        setActivities((prev) => [...prev, ...created]);
        for (const a of created) void scheduleActivityNotification(a);
      }
    } catch (error) {
      console.error('Failed to create activity:', error);
      return 'Failed to save activity';
    }

    setShowAddActivity(false);
    setMobileActiveTab('calendar');
    return null;
  };

  const handleUpdateActivity = async (
    activity: Activity & { days?: DayOfWeek[] },
  ): Promise<string | null> => {
    if (!user?.uid) return 'Not logged in';

    const daysToCheck = activity.days || [activity.day];
    for (const day of daysToCheck) {
      const otherActivities = activities.filter((a) => a.id !== activity.id && a.day === day);
      const newStart = parseTime(activity.startTime);
      const newEnd = parseTime(activity.endTime);

      if (newStart !== null && newEnd !== null) {
        for (const existing of otherActivities) {
          const existingStart = parseTime(existing.startTime);
          const existingEnd = parseTime(existing.endTime);
          if (existingStart === null || existingEnd === null) continue;

          if (newStart < existingEnd && newEnd > existingStart) {
            return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
          }
        }
      }
    }

    try {
      const originalActivity = activities.find((a) => a.id === activity.id);
      const isConvertingToRecurring =
        originalActivity && originalActivity.isRecurring === false && activity.isRecurring === true;
      const isConvertingToOneTime =
        originalActivity && originalActivity.isRecurring === true && activity.isRecurring === false;

      const updatePayload: ActivityUpdate = {
        name: activity.name,
        day: activity.day,
        color: activity.color,
        isRecurring: activity.isRecurring,
        startTime: activity.startTime,
        endTime: activity.endTime,
        location: activity.location,
        description: activity.description,
      };

      if (isConvertingToRecurring) {
        updatePayload.activityDate = undefined;
      }

      if (isConvertingToOneTime) {
        const activityDate = formatDateToISO(dayToDate(activity.day, weekOffset));
        updatePayload.activityDate = activityDate;
      }

      await updateActivity(activity.id, updatePayload);

      let updatedSelf: Activity | null = null;
      setActivities((prev) =>
        prev.map((a) => {
          if (a.id !== activity.id) return a;
          const updated: Activity = {
            ...a,
            ...updatePayload,
            activityDate:
              updatePayload.activityDate === undefined
                ? a.activityDate
                : updatePayload.activityDate ?? undefined,
            updatedAt: Date.now(),
          };
          updatedSelf = updated;
          return updated;
        }),
      );
      if (updatedSelf) void scheduleActivityNotification(updatedSelf);

      const newlyCreated: Activity[] = [];
      if (activity.days && activity.days.length > 1) {
        const existingDay = activity.day;
        const additionalDays = activity.days.filter((d) => d !== existingDay);

        for (const day of additionalDays) {
          const existing = activities.find(
            (a) =>
              a.name === activity.name &&
              a.day === day &&
              a.startTime === activity.startTime &&
              a.endTime === activity.endTime &&
              a.isRecurring === activity.isRecurring &&
              a.id !== activity.id,
          );

          if (!existing) {
            const activityDate = activity.isRecurring
              ? undefined
              : formatDateToISO(dayToDate(day, weekOffset));

            const created = await createActivity({
              userId: user.uid,
              name: activity.name,
              day,
              activityDate,
              color: activity.color,
              isRecurring: activity.isRecurring,
              startTime: activity.startTime,
              endTime: activity.endTime,
              recurrenceEndDate: activity.isRecurring ? activity.recurrenceEndDate : undefined,
              location: activity.location,
              description: activity.description,
            });
            newlyCreated.push(created);
          }
        }
      }
      if (newlyCreated.length > 0) {
        setActivities((prev) => [...prev, ...newlyCreated]);
        for (const a of newlyCreated) void scheduleActivityNotification(a);
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
      return 'Failed to update activity';
    }

    setEditingActivity(null);
    return null;
  };

  const handleDeleteActivity = async (activityId: string): Promise<void> => {
    try {
      await removeActivity(activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      void cancelActivityNotification(activityId);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
    setEditingActivity(null);
  };

  // -------------------------------------------------------------------------
  // AI Planner: approve generated actions (create / update / delete)
  // -------------------------------------------------------------------------
  const handleApproveAISchedule = async (actions: ActivityAction[] | ActivityInput[]) => {
    if (!user?.uid) return;

    try {
      const isActionFormat = Array.isArray(actions) && actions.length > 0 && 'action' in (actions[0] as any);

      if (!isActionFormat) {
        const items = actions as ActivityInput[];
        for (const item of items) {
          const conflict = checkTimeConflict(item.day, item.startTime, item.endTime);
          if (conflict) {
            console.warn(`Skipping activity due to conflict: ${conflict}`);
            continue;
          }

          const activityDate = item.isRecurring
            ? undefined
            : formatDateToISO(dayToDate(item.day, weekOffset));

          await createActivity({
            ...item,
            userId: user.uid,
            activityDate,
          });
        }
        return;
      }

      const activityActions = actions as ActivityAction[];

      for (const action of activityActions) {
        if (action.action === 'delete') {
          if (action.id) {
            await removeActivity(action.id);
            setActivities((prev) => prev.filter((a) => a.id !== action.id));
            void cancelActivityNotification(action.id);
          }
        } else if (action.action === 'update') {
          if (action.id && action.name && action.day && action.startTime && action.endTime) {
            const conflict = checkTimeConflict(
              action.day,
              action.startTime,
              action.endTime,
              weekOffset,
            );
            if (conflict) {
              console.warn(`Skipping update due to conflict: ${conflict}`);
              continue;
            }

            const activityDate = action.isRecurring
              ? undefined
              : formatDateToISO(dayToDate(action.day, weekOffset));

            await updateActivity(action.id, {
              name: action.name,
              day: action.day,
              startTime: action.startTime,
              endTime: action.endTime,
              color: action.color,
              isRecurring: Boolean(action.isRecurring),
              activityDate,
            });

            let updatedFromAI: Activity | null = null;
            setActivities((prev) =>
              prev.map((a) => {
                if (a.id !== action.id) return a;
                const updated: Activity = {
                  ...a,
                  name: action.name!,
                  day: action.day!,
                  startTime: action.startTime!,
                  endTime: action.endTime!,
                  color: action.color || a.color,
                  isRecurring: Boolean(action.isRecurring),
                  activityDate,
                };
                updatedFromAI = updated;
                return updated;
              }),
            );
            if (updatedFromAI) void scheduleActivityNotification(updatedFromAI);
          }
        } else if (action.action === 'create') {
          if (action.name && action.day && action.startTime && action.endTime) {
            const conflict = checkTimeConflict(
              action.day,
              action.startTime,
              action.endTime,
              weekOffset,
            );
            if (conflict) {
              console.warn(`Skipping activity due to conflict: ${conflict}`);
              continue;
            }

            const activityDate = action.isRecurring
              ? undefined
              : formatDateToISO(dayToDate(action.day, weekOffset));

            const created = await createActivity({
              name: action.name,
              day: action.day,
              startTime: action.startTime,
              endTime: action.endTime,
              color: action.color || '#3B82F6',
              isRecurring: Boolean(action.isRecurring),
              userId: user.uid,
              activityDate,
            });

            setActivities((prev) => [...prev, created]);
            void scheduleActivityNotification(created);
          }
        }
      }
    } catch (error) {
      console.error('Failed to apply AI-generated schedule changes:', error);
      throw error;
    }
  };

  // -------------------------------------------------------------------------
  // Google Calendar import
  // -------------------------------------------------------------------------
  const handleImportGoogleCalendar = async () => {
    if (!user?.uid) {
      setImportError('Please sign in first');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const providerToken = await ensureGoogleCalendarToken();

      const weekStart = dayToDate(DayOfWeek.Monday, weekOffset);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = dayToDate(DayOfWeek.Sunday, weekOffset);
      weekEnd.setHours(23, 59, 59, 999);

      const googleEvents = await fetchGoogleCalendarEvents(
        providerToken,
        'primary',
        weekStart,
        weekEnd,
      );

      if (googleEvents.length === 0) {
        setImportSuccess(0);
        setIsImporting(false);
        return;
      }

      const weekStartIso = formatDateToISO(weekStart);
      const weekEndIso = formatDateToISO(weekEnd);

      let importedCount = 0;

      for (const event of googleEvents) {
        if (event.isAllDay) continue;

        const segments = splitCalendarEventIntoDaySegments(event.startTime, event.endTime);

        for (const segment of segments) {
          if (segment.activityDate < weekStartIso || segment.activityDate > weekEndIso) {
            continue;
          }

          const exists = activities.some(
            (a) =>
              a.name === event.title &&
              a.activityDate === segment.activityDate &&
              a.startTime === segment.startTime &&
              a.endTime === segment.endTime,
          );

          if (exists) continue;

          try {
            const created = await createActivity({
              userId: user.uid,
              name: event.title,
              day: segment.day,
              activityDate: segment.activityDate,
              color: '#4285F4',
              isRecurring: false,
              startTime: segment.startTime,
              endTime: segment.endTime,
            });
            setActivities((prev) => [...prev, created]);
            void scheduleActivityNotification(created);
            importedCount++;
          } catch (err) {
            console.error('Failed to import event:', event.title, err);
          }
        }
      }

      setImportSuccess(importedCount);
    } catch (error) {
      console.error('Failed to import Google Calendar:', error);
      if (error instanceof CalendarReauthRequired) {
        setImportError('Allow Google Calendar access in the prompt, then click Import again.');
      } else {
        setImportError(error instanceof Error ? error.message : 'Failed to import calendar');
      }
    }

    setIsImporting(false);
  };

  // -------------------------------------------------------------------------
  // Misc handlers
  // -------------------------------------------------------------------------
  const handleDayPress = (day: DayOfWeek) => {
    if (isMobile) {
      setSelectedDay(day);
    }
  };

  const handleBack = () => {
    setSelectedDay(null);
  };

  const handleAddActivity = () => {
    setShowAddActivity(true);
  };

  const handleOpenAIPlanner = () => {
    setShowAIPlanner(true);
  };

  const handleActivityClick = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleTabChange = (tab: 'calendar' | 'add' | 'ai') => {
    setMobileActiveTab(tab);
    if (tab === 'calendar') {
      setShowAddActivity(false);
      setShowAIPlanner(false);
    } else if (tab === 'add') {
      setShowAIPlanner(false);
    } else if (tab === 'ai') {
      setShowAddActivity(false);
    }
  };

  const handleMonthDayPress = (date: Date) => {
    const todayMonday = dayToDate(DayOfWeek.Monday, 0);
    const targetMonday = new Date(date);
    const dayOfWeekNum = targetMonday.getDay();
    const mondayOffset = dayOfWeekNum === 0 ? -6 : 1 - dayOfWeekNum;
    targetMonday.setDate(date.getDate() + mondayOffset);

    const weekDiff = Math.round(
      (targetMonday.getTime() - todayMonday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
    setWeekOffset(weekDiff);
    setViewMode('weekly');
  };

  const handleToggleView = () => {
    if (viewMode === 'weekly') {
      const weekDate = dayToDate(DayOfWeek.Monday, weekOffset);
      const todayDate = new Date();
      const monthDiff =
        (weekDate.getFullYear() - todayDate.getFullYear()) * 12 +
        (weekDate.getMonth() - todayDate.getMonth());
      setMonthOffset(monthDiff);
    }
    setViewMode(viewMode === 'weekly' ? 'monthly' : 'weekly');
  };

  // -------------------------------------------------------------------------
  // Derived helpers passed to AIPlannerModal
  // -------------------------------------------------------------------------
  const getRecurringActivities = (): Activity[] => activities.filter((a) => a.isRecurring);

  const getWeekStartDate = (): Date => {
    const weekDates = dayOrder.map((day) => dayToDate(day, weekOffset));
    return weekDates[0];
  };

  const refreshExceptions = async () => {
    const weekDates = dayOrder.map((day) => formatDateToISO(dayToDate(day, weekOffset)));
    const activityIds = activities.map((a) => a.id);
    clearExceptionsCache();
    const exceptions = await fetchExceptionsForDateRange(activityIds, weekDates[0], weekDates[6]);
    setCancelledDates(exceptions);
  };

  // -------------------------------------------------------------------------
  // Render branching
  // -------------------------------------------------------------------------

  // Mobile: expanded single-day view
  if (isMobile && selectedDay) {
    const selectedDate = dayToDate(selectedDay, weekOffset);
    const isSelectedDayToday = formatDateToISO(selectedDate) === formatDateToISO(new Date());

    return (
      <>
        <MobileDayExpanded
          day={selectedDay}
          isToday={isSelectedDayToday}
          onBack={handleBack}
          onSignOut={onSignOut}
          activities={getActivitiesForDay(activities, selectedDay, weekOffset, cancelledDates)}
          onActivityClick={handleActivityClick}
        />
        <AddActivityModal
          visible={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onSave={handleSaveActivity}
          colors={colors}
          weekOffset={weekOffset}
        />
        <EditActivityModal
          visible={editingActivity !== null}
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          colors={colors}
          weekOffset={weekOffset}
          onRefreshExceptions={refreshExceptions}
        />
        <AIPlannerModal
          visible={showAIPlanner}
          onClose={() => setShowAIPlanner(false)}
          onApprove={handleApproveAISchedule}
          recurringActivities={getRecurringActivities()}
          allActivities={activities}
          weekStart={getWeekStartDate()}
          colors={colors}
          userId={user?.uid || ''}
        />
      </>
    );
  }

  // Mobile: monthly view
  if (isMobile && viewMode === 'monthly') {
    return (
      <>
        <MonthlyCalendarView
          activities={activities}
          monthOffset={monthOffset}
          onPrevMonth={() => setMonthOffset((prev) => prev - 1)}
          onNextMonth={() => setMonthOffset((prev) => prev + 1)}
          onGoToToday={() => setMonthOffset(0)}
          onDayPress={handleMonthDayPress}
          onActivityClick={handleActivityClick}
          onToggleView={handleToggleView}
          onAddActivity={() => setShowAddActivity(true)}
          colors={colors}
        />
        <AddActivityModal
          visible={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onSave={handleSaveActivity}
          colors={colors}
          mode="monthly"
          monthOffset={monthOffset}
        />
        <EditActivityModal
          visible={editingActivity !== null}
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          colors={colors}
          weekOffset={weekOffset}
          onRefreshExceptions={refreshExceptions}
        />
        <AIPlannerModal
          visible={showAIPlanner}
          onClose={() => setShowAIPlanner(false)}
          onApprove={handleApproveAISchedule}
          recurringActivities={getRecurringActivities()}
          allActivities={activities}
          weekStart={getWeekStartDate()}
          colors={colors}
          userId={user?.uid || ''}
        />
      </>
    );
  }

  // Mobile: weekly compact list view
  if (isMobile) {
    return (
      <>
        <MobileWeekList
          currentDay={currentDay}
          onDayPress={handleDayPress}
          onSignOut={onSignOut}
          onAddActivity={handleAddActivity}
          onOpenAIPlanner={handleOpenAIPlanner}
          activities={activities}
          cancelledDates={cancelledDates}
          activeTab={mobileActiveTab}
          onTabChange={handleTabChange}
          onActivityClick={handleActivityClick}
          onImportGoogleCalendar={handleImportGoogleCalendar}
          isImporting={isImporting}
          importError={importError}
          importSuccess={importSuccess}
          weekOffset={weekOffset}
          onWeekChange={setWeekOffset}
          viewMode={viewMode}
          onToggleView={handleToggleView}
        />
        <AddActivityModal
          visible={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onSave={handleSaveActivity}
          colors={colors}
          weekOffset={weekOffset}
        />
        <EditActivityModal
          visible={editingActivity !== null}
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          colors={colors}
          weekOffset={weekOffset}
          onRefreshExceptions={refreshExceptions}
        />
        <AIPlannerModal
          visible={showAIPlanner}
          onClose={() => setShowAIPlanner(false)}
          onApprove={handleApproveAISchedule}
          recurringActivities={getRecurringActivities()}
          allActivities={activities}
          weekStart={getWeekStartDate()}
          colors={colors}
          userId={user?.uid || ''}
        />
      </>
    );
  }

  // Desktop: monthly view
  if (viewMode === 'monthly') {
    return (
      <>
        <MonthlyCalendarView
          activities={activities}
          monthOffset={monthOffset}
          onPrevMonth={() => setMonthOffset((prev) => prev - 1)}
          onNextMonth={() => setMonthOffset((prev) => prev + 1)}
          onGoToToday={() => setMonthOffset(0)}
          onDayPress={handleMonthDayPress}
          onActivityClick={handleActivityClick}
          onToggleView={handleToggleView}
          onAddActivity={() => setShowAddActivity(true)}
          colors={colors}
        />
        <AddActivityModal
          visible={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onSave={handleSaveActivity}
          colors={colors}
          mode="monthly"
          monthOffset={monthOffset}
        />
        <EditActivityModal
          visible={editingActivity !== null}
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          colors={colors}
          weekOffset={weekOffset}
          onRefreshExceptions={refreshExceptions}
        />
        <AIPlannerModal
          visible={showAIPlanner}
          onClose={() => setShowAIPlanner(false)}
          onApprove={handleApproveAISchedule}
          recurringActivities={getRecurringActivities()}
          allActivities={activities}
          weekStart={getWeekStartDate()}
          colors={colors}
          userId={user?.uid || ''}
        />
      </>
    );
  }

  // Desktop: weekly horizontal grid
  return (
    <>
      <DesktopWeekGrid
        currentDay={currentDay}
        onSignOut={onSignOut}
        onAddActivity={handleAddActivity}
        onOpenAIPlanner={handleOpenAIPlanner}
        activities={activities}
        onActivityClick={handleActivityClick}
        showActivitiesPanel={showActivitiesPanel}
        onToggleActivitiesPanel={() => setShowActivitiesPanel(!showActivitiesPanel)}
        onImportGoogleCalendar={handleImportGoogleCalendar}
        isImporting={isImporting}
        importError={importError}
        importSuccess={importSuccess}
        weekOffset={weekOffset}
        onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
        onNextWeek={() => setWeekOffset((prev) => prev + 1)}
        onGoToToday={() => setWeekOffset(0)}
        viewMode={viewMode}
        onToggleView={handleToggleView}
        cancelledDates={cancelledDates}
      />
      <AddActivityModal
        visible={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onSave={handleSaveActivity}
        colors={colors}
      />
      <EditActivityModal
        visible={editingActivity !== null}
        activity={editingActivity}
        onClose={() => setEditingActivity(null)}
        onSave={handleUpdateActivity}
        onDelete={handleDeleteActivity}
        colors={colors}
        weekOffset={weekOffset}
        onRefreshExceptions={refreshExceptions}
      />
      <AIPlannerModal
        visible={showAIPlanner}
        onClose={() => setShowAIPlanner(false)}
        onApprove={handleApproveAISchedule}
        recurringActivities={getRecurringActivities()}
        allActivities={activities}
        weekStart={getWeekStartDate()}
        colors={colors}
        userId={user?.uid || ''}
      />
    </>
  );
};
