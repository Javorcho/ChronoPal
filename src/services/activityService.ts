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
        try {
          const latest = await fetchActivities(userId);
          callback(latest);
        } catch (error) {
          console.error('[subscribeToActivities] Error fetching after change:', error);
        }
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchActivities(userId)
          .then(callback)
          .catch((error) => {
            console.error('[subscribeToActivities] Error on initial fetch:', error);
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
  
  // Verify user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  if (user.id !== input.userId) {
    console.warn('[createActivity] User ID mismatch:', { sessionUserId: user.id, inputUserId: input.userId });
  }

  const payload = {
    user_id: input.userId,
    name: input.name,
    color: input.color,
    day: input.day,
    start_time: input.startTime,
    end_time: input.endTime,
    is_recurring: input.isRecurring ?? false,
    recurrence: input.recurrence ?? null,
    notes: input.notes ?? null,
  };

  console.log('[createActivity] Inserting payload:', payload);
  const { data, error } = await supabase.from(COLLECTION).insert(payload).select().single();
  if (error) {
    console.error('[createActivity] Database error:', error);
    console.error('[createActivity] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
  
  console.log('[createActivity] Successfully created:', data);

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
  
  // Verify user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // Map camelCase fields to snake_case database fields
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.day !== undefined) payload.day = updates.day;
  if (updates.startTime !== undefined) payload.start_time = updates.startTime;
  if (updates.endTime !== undefined) payload.end_time = updates.endTime;
  if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;
  if (updates.recurrence !== undefined) payload.recurrence = updates.recurrence;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  console.log('[updateActivity] Updating activity:', id, 'with payload:', payload);
  const { data, error } = await supabase
    .from(COLLECTION)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateActivity] Database error:', error);
    console.error('[updateActivity] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('[updateActivity] Successfully updated:', data);
  return data;
};

export const removeActivity = async (id: ActivityId) => {
  if (!isSupabaseConfigured) {
    return;
  }

  const supabase = getSupabaseClient();
  
  // Verify user session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('[removeActivity] Deleting activity:', id);
  const { error } = await supabase.from(COLLECTION).delete().eq('id', id);
  if (error) {
    console.error('[removeActivity] Database error:', error);
    console.error('[removeActivity] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
  
  console.log('[removeActivity] Successfully deleted:', id);
};

