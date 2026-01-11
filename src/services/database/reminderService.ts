import {
  Reminder,
  ReminderId,
  ReminderInput,
  ReminderType,
} from '@/types/schedule';
import { isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

const COLLECTION = 'reminders';

const mapRowToReminder = (row: any): Reminder => ({
  id: row.id,
  activityId: row.activity_id,
  userId: row.user_id,
  remindAt: row.remind_at ? new Date(row.remind_at).getTime() : Date.now(),
  type: row.type || ReminderType.Notification,
  message: row.message,
  sent: row.sent || false,
  sentAt: row.sent_at ? new Date(row.sent_at).getTime() : undefined,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
});

export const subscribeToReminders = (
  userId: string,
  callback: (reminders: Reminder[]) => void,
) => {
  if (!isSupabaseConfigured) {
    callback([]);
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
      const latest = await fetchReminders(userId);
      callback(latest);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchReminders(userId).then(callback).catch(() => callback([]));
      }
    });

  return () => { supabase.removeChannel(channel); };
};

export const fetchReminders = async (userId: string): Promise<Reminder[]> => {
  if (!isSupabaseConfigured) return [];

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('user_id', userId)
    .order('remind_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRowToReminder);
};

export const fetchRemindersForActivity = async (activityId: string): Promise<Reminder[]> => {
  if (!isSupabaseConfigured) return [];

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('activity_id', activityId)
    .order('remind_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRowToReminder);
};

export const fetchUpcomingReminders = async (userId: string, minutes: number = 60): Promise<Reminder[]> => {
  if (!isSupabaseConfigured) return [];

  const supabase = getSupabaseClient();
  const now = new Date();
  const future = new Date(now.getTime() + minutes * 60 * 1000);

  const { data, error } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('user_id', userId)
    .eq('sent', false)
    .gte('remind_at', now.toISOString())
    .lte('remind_at', future.toISOString())
    .order('remind_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRowToReminder);
};

export const createReminder = async (input: ReminderInput): Promise<Reminder> => {
  if (!isSupabaseConfigured) {
    return {
      id: `mock-${Date.now()}`,
      ...input,
      type: input.type || ReminderType.Notification,
      sent: false,
      createdAt: Date.now(),
    };
  }

  const supabase = getSupabaseClient();
  const payload = {
    activity_id: input.activityId,
    user_id: input.userId,
    remind_at: new Date(input.remindAt).toISOString(),
    type: input.type || ReminderType.Notification,
    message: input.message,
  };

  const { data, error } = await supabase.from(COLLECTION).insert(payload).select().single();
  if (error) throw error;
  return mapRowToReminder(data);
};

export const markReminderSent = async (id: ReminderId) => {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(COLLECTION)
    .update({ sent: true, sent_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

export const removeReminder = async (id: ReminderId) => {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.from(COLLECTION).delete().eq('id', id);
  if (error) throw error;
};

export const removeRemindersForActivity = async (activityId: string) => {
  if (!isSupabaseConfigured) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.from(COLLECTION).delete().eq('activity_id', activityId);
  if (error) throw error;
};

// Create common reminder presets
export const createReminderPresets = async (
  activityId: string,
  userId: string,
  activityTime: Date,
  presets: ('5min' | '15min' | '30min' | '1hour' | '1day')[] = ['15min'],
): Promise<Reminder[]> => {
  const reminders: Reminder[] = [];
  
  const presetMinutes: Record<string, number> = {
    '5min': 5,
    '15min': 15,
    '30min': 30,
    '1hour': 60,
    '1day': 1440,
  };

  for (const preset of presets) {
    const minutesBefore = presetMinutes[preset];
    const remindAt = new Date(activityTime.getTime() - minutesBefore * 60 * 1000);
    
    if (remindAt > new Date()) {
      const reminder = await createReminder({
        activityId,
        userId,
        remindAt: remindAt.getTime(),
        type: ReminderType.Notification,
        message: `Reminder: Activity starts in ${preset.replace('min', ' minutes').replace('hour', ' hour').replace('day', ' day')}`,
      });
      reminders.push(reminder);
    }
  }

  return reminders;
};
