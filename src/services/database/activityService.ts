import {
  Activity,
  ActivityId,
  ActivityInput,
  ActivityUpdate,
  ActivitySource,
  ActivityStatus,
  DayOfWeek,
  dayOrder,
  formatDateToISO,
  dayToDate,
  dateToDayOfWeek,
} from '@/types/schedule';
import { isSupabaseConfigured } from '@/config/env';
import { getMockActivities } from '@/utils/mockActivities';
import { getSupabaseClient } from '@/lib/supabase';

const COLLECTION = 'activities';

const mapRowToActivity = (row: any): Activity => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  color: row.color,
  day: row.day,
  activityDate: row.activity_date,
  startTime: row.start_time,
  endTime: row.end_time,
  isRecurring: row.is_recurring,
  recurrence: row.recurrence,
  recurrenceRule: row.recurrence_rule,
  recurrenceEndDate: row.recurrence_end_date,
  parentActivityId: row.parent_activity_id,
  categoryId: row.category_id,
  status: row.status || ActivityStatus.Scheduled,
  priority: row.priority,
  description: row.description,
  location: row.location,
  notes: row.notes,
  externalId: row.external_id,
  source: row.source || ActivitySource.Manual,
  lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at).getTime() : undefined,
  timezone: row.timezone,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
  updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
});

const mapInputToPayload = (input: ActivityInput): Record<string, any> => ({
  user_id: input.userId,
  name: input.name,
  color: input.color,
  day: input.day,
  activity_date: input.activityDate,
  start_time: input.startTime,
  end_time: input.endTime,
  is_recurring: input.isRecurring,
  recurrence: input.recurrence,
  recurrence_rule: input.recurrenceRule,
  recurrence_end_date: input.recurrenceEndDate,
  parent_activity_id: input.parentActivityId,
  category_id: input.categoryId,
  status: input.status || ActivityStatus.Scheduled,
  priority: input.priority,
  description: input.description,
  location: input.location,
  notes: input.notes,
  external_id: input.externalId,
  source: input.source || ActivitySource.Manual,
  last_synced_at: input.lastSyncedAt ? new Date(input.lastSyncedAt).toISOString() : null,
  timezone: input.timezone,
});

export const subscribeToActivities = (
  userId: string,
  callback: (activities: Activity[]) => void,
) => {
  if (!isSupabaseConfigured) {
    callback(getMockActivities(userId));
    return () => undefined;
  }

  const supabase = getSupabaseClient();
  const channel = supabase
    .channel(`public:${COLLECTION}:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: COLLECTION,
      filter: `user_id=eq.${userId}`,
    }, async () => {
      const latest = await fetchActivities(userId);
      callback(latest);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchActivities(userId).then(callback).catch(() => {
          callback(getMockActivities(userId));
        });
      }
    });

  return () => { supabase.removeChannel(channel); };
};

export const fetchActivities = async (userId: string): Promise<Activity[]> => {
  if (!isSupabaseConfigured) {
    return getMockActivities(userId);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRowToActivity);
};

export const fetchActivitiesForDateRange = async (
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Activity[]> => {
  if (!isSupabaseConfigured) {
    const mock = getMockActivities(userId);
    return mock.filter(a => {
      if (a.activityDate) return a.activityDate >= startDate && a.activityDate <= endDate;
      return a.isRecurring;
    });
  }

  const supabase = getSupabaseClient();
  
  // Fetch all activities (including recurring ones)
  const { data: activitiesData, error: activitiesError } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('user_id', userId)
    .or(`activity_date.gte.${startDate},activity_date.lte.${endDate},and(activity_date.is.null,is_recurring.eq.true)`)
    .order('start_time', { ascending: true });

  if (activitiesError) throw activitiesError;
  
  const allActivities = (activitiesData ?? []).map(mapRowToActivity);
  
  // Fetch exceptions for this date range
  const activityIds = allActivities.map(a => a.id);
  if (activityIds.length === 0) return allActivities;
  
  const { data: exceptionsData } = await supabase
    .from('activity_exceptions')
    .select('activity_id, exception_date, exception_type')
    .in('activity_id', activityIds)
    .eq('exception_type', 'cancelled')
    .gte('exception_date', startDate)
    .lte('exception_date', endDate);
  
  // Create a map of cancelled dates per activity
  const cancelledDates = new Map<string, Set<string>>();
  (exceptionsData || []).forEach((ex: any) => {
    if (!cancelledDates.has(ex.activity_id)) {
      cancelledDates.set(ex.activity_id, new Set());
    }
    cancelledDates.get(ex.activity_id)!.add(ex.exception_date);
  });
  
  // Filter out activities that are cancelled for specific dates
  return allActivities.filter(activity => {
    // For specific date activities, check if that date is cancelled
    if (activity.activityDate) {
      const cancelled = cancelledDates.get(activity.id);
      return !cancelled || !cancelled.has(activity.activityDate);
    }
    
    // For recurring activities, we keep them but filter in getActivitiesForDay
    return true;
  });
};

export const fetchActivitiesForWeek = async (userId: string, weekOffset: number = 0): Promise<Activity[]> => {
  const weekDates = dayOrder.map(day => formatDateToISO(dayToDate(day, weekOffset)));
  return fetchActivitiesForDateRange(userId, weekDates[0], weekDates[6]);
};

// Store exceptions in memory for quick lookup
let exceptionsCache: Map<string, Set<string>> = new Map();
let exceptionsCacheDate: string = '';

/**
 * Fetch and cache exceptions for a date range
 */
export const fetchExceptionsForDateRange = async (
  activityIds: string[],
  startDate: string,
  endDate: string
): Promise<Map<string, Set<string>>> => {
  if (!isSupabaseConfigured || activityIds.length === 0) {
    return new Map();
  }

  // Use cache if it's for the same date range
  const cacheKey = `${startDate}-${endDate}`;
  if (exceptionsCacheDate === cacheKey && exceptionsCache.size > 0) {
    return exceptionsCache;
  }

  const supabase = getSupabaseClient();
  const { data: exceptionsData } = await supabase
    .from('activity_exceptions')
    .select('activity_id, exception_date, exception_type')
    .in('activity_id', activityIds)
    .eq('exception_type', 'cancelled')
    .gte('exception_date', startDate)
    .lte('exception_date', endDate);

  const cancelledDates = new Map<string, Set<string>>();
  (exceptionsData || []).forEach((ex: any) => {
    if (!cancelledDates.has(ex.activity_id)) {
      cancelledDates.set(ex.activity_id, new Set());
    }
    cancelledDates.get(ex.activity_id)!.add(ex.exception_date);
  });

  exceptionsCache = cancelledDates;
  exceptionsCacheDate = cacheKey;
  return cancelledDates;
};

/**
 * Clear exceptions cache (call when activities change)
 */
export const clearExceptionsCache = () => {
  exceptionsCache = new Map();
  exceptionsCacheDate = '';
};

export const getActivitiesForDay = (
  activities: Activity[], 
  day: DayOfWeek, 
  weekOffset: number = 0,
  cancelledDates?: Map<string, Set<string>>
): Activity[] => {
  const targetDate = formatDateToISO(dayToDate(day, weekOffset));
  
  return activities.filter(activity => {
    // For specific date activities
    if (activity.activityDate) {
      if (activity.activityDate !== targetDate) return false;
      // Check if cancelled
      if (cancelledDates) {
        const cancelled = cancelledDates.get(activity.id);
        if (cancelled && cancelled.has(activity.activityDate)) return false;
      }
      return true;
    }
    
    // For recurring activities on this day
    if (activity.isRecurring && activity.day === day) {
      // Check if this specific date is cancelled
      if (cancelledDates) {
        const cancelled = cancelledDates.get(activity.id);
        if (cancelled && cancelled.has(targetDate)) return false;
      }
      return true;
    }
    
    // Legacy: non-recurring activities on this day
    if (activity.day === day && !activity.activityDate) {
      return true;
    }
    
    return false;
  });
};

export const createActivity = async (input: ActivityInput): Promise<Activity> => {
  if (!isSupabaseConfigured) {
    return {
      id: `mock-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...input,
      status: input.status || ActivityStatus.Scheduled,
      source: input.source || ActivitySource.Manual,
    };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(COLLECTION).insert(mapInputToPayload(input)).select().single();
  if (error) throw error;
  return mapRowToActivity(data);
};

export const createActivityForDate = async (input: Omit<ActivityInput, 'activityDate'>, date: Date): Promise<Activity> => {
  return createActivity({ ...input, activityDate: formatDateToISO(date), day: dateToDayOfWeek(date) });
};

export const updateActivity = async (id: ActivityId, updates: ActivityUpdate) => {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabaseClient();
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.day !== undefined) payload.day = updates.day;
  if (updates.activityDate !== undefined) payload.activity_date = updates.activityDate;
  if (updates.startTime !== undefined) payload.start_time = updates.startTime;
  if (updates.endTime !== undefined) payload.end_time = updates.endTime;
  if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;
  if (updates.recurrence !== undefined) payload.recurrence = updates.recurrence;
  if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.externalId !== undefined) payload.external_id = updates.externalId;
  if (updates.source !== undefined) payload.source = updates.source;

  const { error } = await supabase.from(COLLECTION).update(payload).eq('id', id);
  if (error) throw error;
};

export const removeActivity = async (id: ActivityId) => {
  if (!isSupabaseConfigured) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase.from(COLLECTION).delete().eq('id', id);
  if (error) throw error;
};

export const findByExternalId = async (userId: string, externalId: string, source: ActivitySource): Promise<Activity | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('user_id', userId)
    .eq('external_id', externalId)
    .eq('source', source)
    .single();
  if (error || !data) return null;
  return mapRowToActivity(data);
};

export const importExternalActivity = async (input: ActivityInput): Promise<Activity> => {
  if (!input.externalId || !input.source) throw new Error('External ID and source required');
  const existing = await findByExternalId(input.userId, input.externalId, input.source);
  if (existing) {
    await updateActivity(existing.id, { ...input, lastSyncedAt: Date.now() });
    return { ...existing, ...input, lastSyncedAt: Date.now() };
  }
  return createActivity({ ...input, lastSyncedAt: Date.now() });
};

export const completeActivity = async (id: ActivityId) => updateActivity(id, { status: ActivityStatus.Completed });
export const cancelActivity = async (id: ActivityId) => updateActivity(id, { status: ActivityStatus.Cancelled });

export const getActivityStats = async (userId: string) => {
  const activities = await fetchActivities(userId);
  const today = formatDateToISO(new Date());
  const todayDayOfWeek = dateToDayOfWeek(new Date());
  return {
    total: activities.length,
    scheduled: activities.filter(a => a.status === ActivityStatus.Scheduled || !a.status).length,
    completed: activities.filter(a => a.status === ActivityStatus.Completed).length,
    recurring: activities.filter(a => a.isRecurring).length,
    todayCount: activities.filter(a => {
      if (a.activityDate) return a.activityDate === today;
      return a.day === todayDayOfWeek;
    }).length,
  };
};
