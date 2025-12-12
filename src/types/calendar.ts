// Calendar event types for importing from external calendars

export type CalendarProvider = 'google' | 'microsoft' | 'apple';

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601 datetime
  endTime: string; // ISO 8601 datetime
  isAllDay: boolean;
  location?: string;
  color?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    until?: string;
    count?: number;
    daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  };
  provider: CalendarProvider;
  originalId: string; // ID from the original calendar
};

export type Calendar = {
  id: string;
  name: string;
  color?: string;
  isPrimary: boolean;
  provider: CalendarProvider;
};

export type CalendarSyncStatus = {
  provider: CalendarProvider;
  lastSynced?: Date;
  isConnected: boolean;
  calendarCount: number;
  eventCount: number;
};

// Google Calendar API types
export type GoogleCalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  recurrence?: string[];
};

export type GoogleCalendarList = {
  id: string;
  summary: string;
  backgroundColor?: string;
  primary?: boolean;
};

// Microsoft Graph Calendar API types
export type MicrosoftCalendarEvent = {
  id: string;
  subject: string;
  body?: {
    content: string;
    contentType: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay: boolean;
  location?: {
    displayName: string;
  };
  recurrence?: {
    pattern: {
      type: string;
      interval: number;
      daysOfWeek?: string[];
    };
    range: {
      type: string;
      startDate: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
};

export type MicrosoftCalendar = {
  id: string;
  name: string;
  color?: string;
  isDefaultCalendar?: boolean;
};

