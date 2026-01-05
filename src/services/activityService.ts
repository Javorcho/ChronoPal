import {
  Activity,
  ActivityId,
  ActivityInput,
  ActivityUpdate,
} from '@/types/schedule';
import { isSupabaseConfigured } from '@/config/env';
import { getMockActivities } from '@/utils/mockActivities';
import { getSupabaseClient } from '@/lib/supabase';

const COLLECTION = 'activities';

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
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COLLECTION,
        filter: `user_id=eq.${userId}`,
      },
      async () => {
        const latest = await fetchActivities(userId);
        callback(latest);
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchActivities(userId).then(callback).catch(() => {
          callback(getMockActivities(userId));
        });
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
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

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    color: row.color,
    day: row.day,
    startTime: row.start_time,
    endTime: row.end_time,
    isRecurring: row.is_recurring,
    recurrence: row.recurrence,
    notes: row.notes,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
  }));
};

export const createActivity = async (
  input: ActivityInput,
): Promise<Activity> => {
  if (!isSupabaseConfigured) {
    const fallbackActivity: Activity = {
      id: `mock-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...input,
    };
    return fallbackActivity;
  }

  const supabase = getSupabaseClient();
  const payload = {
    user_id: input.userId,
    name: input.name,
    color: input.color,
    day: input.day,
    start_time: input.startTime,
    end_time: input.endTime,
    is_recurring: input.isRecurring,
    recurrence: input.recurrence,
    notes: input.notes,
  };

  const { data, error } = await supabase.from(COLLECTION).insert(payload).select().single();
  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    color: data.color,
    day: data.day,
    startTime: data.start_time,
    endTime: data.end_time,
    isRecurring: data.is_recurring,
    recurrence: data.recurrence,
    notes: data.notes,
    createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now(),
    updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : Date.now(),
  };
};

export const updateActivity = async (
  id: ActivityId,
  updates: ActivityUpdate,
) => {
  if (!isSupabaseConfigured) {
    return;
  }

  const supabase = getSupabaseClient();
  const payload: Record<string, any> = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.startTime) payload.start_time = updates.startTime;
  if (updates.endTime) payload.end_time = updates.endTime;
  if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;

  delete payload.startTime;
  delete payload.endTime;
  delete payload.isRecurring;

  const { error } = await supabase.from(COLLECTION).update(payload).eq('id', id);
  if (error) {
    throw error;
  }
};

export const removeActivity = async (id: ActivityId) => {
  if (!isSupabaseConfigured) {
    return;
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from(COLLECTION).delete().eq('id', id);
  if (error) {
    throw error;
  }
};

