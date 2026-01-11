import { Activity, DayOfWeek, dayNames } from '@/types/schedule';

/**
 * Build the system prompt for Gemini AI to generate schedules
 */
export const buildSchedulePrompt = (
  weekStart: Date,
  recurringActivities: Activity[]
): string => {
  // Build context about existing recurring activities
  const recurringContext = recurringActivities.length > 0
    ? `\n\nExisting recurring activities that must be respected (do not create conflicts):\n${recurringActivities.map(a => 
        `- ${a.name}: ${dayNames[a.day]} from ${a.startTime} to ${a.endTime}`
      ).join('\n')}`
    : '\n\nNo existing recurring activities.';

  // Format week start date
  const weekStartStr = weekStart.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Create the system prompt
  return `You are a helpful schedule assistant. Your task is to parse a user's natural language request and generate a weekly schedule as a JSON array.

Context:
- Week starts on: ${weekStartStr}
- Current day names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday${recurringContext}

Instructions:
1. Parse the user's request and extract all activities they want to schedule
2. For each activity, determine:
   - name: The activity name (e.g., "Gym", "Meeting", "Study Session")
   - day: One of: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
   - startTime: Start time in 24-hour format "HH:mm" (e.g., "09:00", "14:30")
   - endTime: End time in 24-hour format "HH:mm" (e.g., "10:00", "16:00")
   - color: A hex color code (choose from: #EF4444, #F97316, #F59E0B, #22C55E, #14B8A6, #06B6D4, #3B82F6, #6366F1, #8B5CF6, #EC4899)
   - isRecurring: true if the activity repeats weekly, false if it's a one-time event

3. If the user mentions "every day", "daily", create activities for all 7 days
4. If the user mentions "weekdays", create activities for Monday-Friday
5. If the user mentions "weekend", create activities for Saturday-Sunday
6. If multiple days are mentioned, create separate activities for each day
7. If a time range is mentioned (e.g., "9am-11am"), use that range
8. If only a start time is mentioned (e.g., "at 6am"), assume 1 hour duration
9. DO NOT create activities that conflict with existing recurring activities
10. If the user requests multiple different activities, create separate entries for each
11. If the user requests activities for a specific day, create activities for that day only
12. Only delete activities that are explicitly requested to be deleted
Return ONLY a valid JSON array, no markdown, no code blocks, no explanation. Example format:
[
  {
    "name": "Gym",
    "day": "monday",
    "startTime": "06:00",
    "endTime": "07:00",
    "color": "#EF4444",
    "isRecurring": true
  },
  {
    "name": "Gym",
    "day": "tuesday",
    "startTime": "06:00",
    "endTime": "07:00",
    "color": "#EF4444",
    "isRecurring": true
  }
]`;
};

/**
 * Build the full prompt with user request
 */
export const buildFullPrompt = (
  systemPrompt: string,
  userPrompt: string
): string => {
  return `${systemPrompt}\n\nUser request: ${userPrompt}\n\nGenerate the schedule as JSON:`;
};
