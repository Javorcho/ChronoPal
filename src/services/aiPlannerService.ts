import {
  Activity,
  ActivityInput,
  DayOfWeek,
  dayOrder,
  dayNames,
  formatDateToISO,
  dayToDate,
} from '@/types/schedule';
import { buildSchedulePrompt, buildFullPrompt } from './aiPrompts';
import { callGeminiAPI, isGeminiAPIConfigured } from './geminiClient';

/**
 * Generate a schedule from natural language prompt using Gemini API
 */
export const generateSchedule = async (
  prompt: string,
  recurringActivities: Activity[],
  weekStart: Date,
  userId: string
): Promise<ActivityInput[]> => {
  if (!isGeminiAPIConfigured()) {
    throw new Error('Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY environment variable.');
  }

  try {
    // Build the system prompt
    const systemPrompt = buildSchedulePrompt(weekStart, recurringActivities);
    
    // Build the full prompt with user request
    const fullPrompt = buildFullPrompt(systemPrompt, prompt);

    // Call Gemini API
    const text = await callGeminiAPI(fullPrompt);

    // Parse the JSON response
    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // Parse JSON
    let parsedActivities: any[];
    try {
      parsedActivities = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Failed to parse AI response. Please try rephrasing your request.');
    }

    // Validate and transform to ActivityInput format
    const activities: ActivityInput[] = [];

    for (const activity of parsedActivities) {
      // Validate required fields
      if (!activity.name || !activity.day || !activity.startTime || !activity.endTime) {
        console.warn('Skipping invalid activity:', activity);
        continue;
      }

      // Validate day
      const day = activity.day.toLowerCase();
      if (!dayOrder.includes(day as DayOfWeek)) {
        console.warn(`Invalid day: ${day}, skipping activity:`, activity);
        continue;
      }

      // Validate time format (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(activity.startTime) || !timeRegex.test(activity.endTime)) {
        console.warn('Invalid time format, skipping activity:', activity);
        continue;
      }

      // Validate color (use provided or default)
      const color = activity.color && /^#[0-9A-Fa-f]{6}$/.test(activity.color)
        ? activity.color
        : '#3B82F6'; // Default blue

      activities.push({
        name: activity.name.trim(),
        day: day as DayOfWeek,
        startTime: activity.startTime,
        endTime: activity.endTime,
        color,
        isRecurring: Boolean(activity.isRecurring),
        userId,
      });
    }

    if (activities.length === 0) {
      throw new Error('No valid activities were generated. Please try rephrasing your request.');
    }

    return activities;
  } catch (error: any) {
    // Re-throw API errors as-is (they're already formatted in geminiClient)
    if (error.message?.includes('parse')) {
      throw error; // Re-throw parse errors as-is
    } else {
      throw error; // Re-throw API errors from geminiClient
    }
  }
};

/**
 * Validate generated schedule against existing recurring activities
 */
export const validateSchedule = (
  activities: ActivityInput[],
  recurringActivities: Activity[]
): { valid: boolean; conflicts: string[] } => {
  const conflicts: string[] = [];

  for (const newActivity of activities) {
    // Check against recurring activities
    for (const recurring of recurringActivities) {
      if (recurring.day === newActivity.day) {
        const newStart = parseTime(newActivity.startTime);
        const newEnd = parseTime(newActivity.endTime);
        const recStart = parseTime(recurring.startTime);
        const recEnd = parseTime(recurring.endTime);

        if (newStart !== null && newEnd !== null && recStart !== null && recEnd !== null) {
          // Check for overlap
          if (newStart < recEnd && newEnd > recStart) {
            conflicts.push(
              `${newActivity.name} on ${dayNames[newActivity.day]} conflicts with recurring "${recurring.name}" (${recurring.startTime} - ${recurring.endTime})`
            );
          }
        }
      }
    }

    // Check against other generated activities
    for (const other of activities) {
      if (other !== newActivity && other.day === newActivity.day) {
        const newStart = parseTime(newActivity.startTime);
        const newEnd = parseTime(newActivity.endTime);
        const otherStart = parseTime(other.startTime);
        const otherEnd = parseTime(other.endTime);

        if (newStart !== null && newEnd !== null && otherStart !== null && otherEnd !== null) {
          if (newStart < otherEnd && newEnd > otherStart) {
            conflicts.push(
              `${newActivity.name} conflicts with ${other.name} on ${dayNames[newActivity.day]}`
            );
          }
        }
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
};

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
function parseTime(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) return null;
  return hours * 60 + minutes;
}
