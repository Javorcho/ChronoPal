import {
  ActivityException,
  ActivityExceptionInput,
  ActivityId,
  ExceptionId,
  ExceptionType,
  DayOfWeek,
  formatDateToISO,
} from '@/types/schedule';
import { isSupabaseConfigured } from '@/config/env';
import { getSupabaseClient } from '@/lib/supabase';

const COLLECTION = 'activity_exceptions';

const mapRowToException = (row: any): ActivityException => ({
  id: row.id,
  activityId: row.activity_id,
  exceptionDate: row.exception_date,
  exceptionType: row.exception_type as ExceptionType,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
});

const mapInputToPayload = (input: ActivityExceptionInput): Record<string, any> => ({
  activity_id: input.activityId,
  exception_date: input.exceptionDate,
  exception_type: input.exceptionType,
});

/**
 * Create a single activity exception
 */
export const createException = async (input: ActivityExceptionInput): Promise<ActivityException> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseClient();
  const payload = mapInputToPayload(input);

  const { data, error } = await supabase
    .from(COLLECTION)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create exception: ${error.message}`);
  }

  return mapRowToException(data);
};

/**
 * Create exceptions for multiple weeks for a recurring activity
 * @param activityId - The ID of the recurring activity
 * @param dayOfWeek - The day of week the activity occurs on
 * @param weeks - Number of weeks to skip (starting from next occurrence)
 * @param startDate - Optional start date (defaults to today)
 */
export const createExceptionsForWeeks = async (
  activityId: ActivityId,
  dayOfWeek: DayOfWeek,
  weeks: number,
  startDate?: Date
): Promise<ActivityException[]> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const today = startDate || new Date();
  today.setHours(0, 0, 0, 0);

  // Find the next occurrence of this day of week
  const nextOccurrence = findNextOccurrence(dayOfWeek, today);
  
  // Generate dates for the specified number of weeks
  const exceptionDates: string[] = [];
  for (let i = 0; i < weeks; i++) {
    const date = new Date(nextOccurrence);
    date.setDate(nextOccurrence.getDate() + (i * 7));
    exceptionDates.push(formatDateToISO(date));
  }

  // Create exceptions for each date
  const exceptions: ActivityException[] = [];
  const supabase = getSupabaseClient();

  for (const exceptionDate of exceptionDates) {
    // Check if exception already exists (use maybeSingle to avoid 406 error when no result)
    const { data: existing, error: checkError } = await supabase
      .from(COLLECTION)
      .select('id')
      .eq('activity_id', activityId)
      .eq('exception_date', exceptionDate)
      .maybeSingle();

    // If there's an error (other than "not found"), log it but continue
    if (checkError && checkError.code !== 'PGRST116') {
      console.error(`Error checking exception for ${exceptionDate}:`, checkError);
    }

    // Only create if it doesn't exist
    if (!existing) {
      const input: ActivityExceptionInput = {
        activityId,
        exceptionDate,
        exceptionType: ExceptionType.Cancelled,
      };

      try {
        const exception = await createException(input);
        exceptions.push(exception);
      } catch (error) {
        console.error(`Failed to create exception for ${exceptionDate}:`, error);
        // Continue with other dates even if one fails
      }
    }
  }

  return exceptions;
};

/**
 * Find the next occurrence of a day of week from a given date
 */
const findNextOccurrence = (dayOfWeek: DayOfWeek, fromDate: Date): Date => {
  // Map DayOfWeek enum to JavaScript Date.getDay() indices (0=Sunday, 1=Monday, etc.)
  const dayMap: Record<DayOfWeek, number> = {
    [DayOfWeek.Sunday]: 0,
    [DayOfWeek.Monday]: 1,
    [DayOfWeek.Tuesday]: 2,
    [DayOfWeek.Wednesday]: 3,
    [DayOfWeek.Thursday]: 4,
    [DayOfWeek.Friday]: 5,
    [DayOfWeek.Saturday]: 6,
  };
  
  const targetDayIndex = dayMap[dayOfWeek];
  const currentDayIndex = fromDate.getDay();
  
  let daysUntilNext = targetDayIndex - currentDayIndex;
  if (daysUntilNext <= 0) {
    daysUntilNext += 7; // Next week
  }
  
  const nextDate = new Date(fromDate);
  nextDate.setDate(fromDate.getDate() + daysUntilNext);
  return nextDate;
};

/**
 * Get all exceptions for an activity
 */
export const getExceptionsForActivity = async (activityId: ActivityId): Promise<ActivityException[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(COLLECTION)
    .select('*')
    .eq('activity_id', activityId)
    .order('exception_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch exceptions:', error);
    return [];
  }

  return (data || []).map(mapRowToException);
};

/**
 * Delete a specific exception
 */
export const deleteException = async (exceptionId: ExceptionId): Promise<void> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(COLLECTION)
    .delete()
    .eq('id', exceptionId);

  if (error) {
    throw new Error(`Failed to delete exception: ${error.message}`);
  }
};

/**
 * Delete all exceptions for an activity
 */
export const deleteExceptionsForActivity = async (activityId: ActivityId): Promise<void> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(COLLECTION)
    .delete()
    .eq('activity_id', activityId);

  if (error) {
    throw new Error(`Failed to delete exceptions: ${error.message}`);
  }
};

/**
 * Delete exceptions for specific dates
 */
export const deleteExceptionsForDates = async (
  activityId: ActivityId,
  dates: string[]
): Promise<void> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  if (dates.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(COLLECTION)
    .delete()
    .eq('activity_id', activityId)
    .in('exception_date', dates);

  if (error) {
    throw new Error(`Failed to delete exceptions: ${error.message}`);
  }
};
