// Calendar service for fetching events from Google, Microsoft, and Apple calendars

import {
  Calendar,
  CalendarEvent,
  CalendarProvider,
  GoogleCalendarEvent,
  GoogleCalendarList,
  MicrosoftCalendar,
  MicrosoftCalendarEvent,
} from '@/types/calendar';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const MICROSOFT_GRAPH_API = 'https://graph.microsoft.com/v1.0';

// Helper to convert Google Calendar event to our format
const googleEventToCalendarEvent = (event: GoogleCalendarEvent): CalendarEvent => {
  const isAllDay = !event.start.dateTime;
  
  return {
    id: `google-${event.id}`,
    title: event.summary || 'Untitled',
    description: event.description,
    startTime: event.start.dateTime || event.start.date || '',
    endTime: event.end.dateTime || event.end.date || '',
    isAllDay,
    location: event.location,
    provider: 'google',
    originalId: event.id,
  };
};

// Helper to convert Microsoft Calendar event to our format
const microsoftEventToCalendarEvent = (event: MicrosoftCalendarEvent): CalendarEvent => {
  return {
    id: `microsoft-${event.id}`,
    title: event.subject || 'Untitled',
    description: event.body?.content,
    startTime: event.start.dateTime,
    endTime: event.end.dateTime,
    isAllDay: event.isAllDay,
    location: event.location?.displayName,
    provider: 'microsoft',
    originalId: event.id,
  };
};

// ============= GOOGLE CALENDAR API =============

export const fetchGoogleCalendars = async (accessToken: string): Promise<Calendar[]> => {
  const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch Google calendars');
  }

  const data = await response.json();
  const calendars: GoogleCalendarList[] = data.items || [];

  return calendars.map((cal) => ({
    id: cal.id,
    name: cal.summary,
    color: cal.backgroundColor,
    isPrimary: cal.primary || false,
    provider: 'google' as CalendarProvider,
  }));
};

export const fetchGoogleCalendarEvents = async (
  accessToken: string,
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date,
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  if (timeMin) {
    params.set('timeMin', timeMin.toISOString());
  }
  if (timeMax) {
    params.set('timeMax', timeMax.toISOString());
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch Google calendar events');
  }

  const data = await response.json();
  const events: GoogleCalendarEvent[] = data.items || [];

  return events.map(googleEventToCalendarEvent);
};

// ============= MICROSOFT CALENDAR API =============

export const fetchMicrosoftCalendars = async (accessToken: string): Promise<Calendar[]> => {
  const response = await fetch(`${MICROSOFT_GRAPH_API}/me/calendars`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch Microsoft calendars');
  }

  const data = await response.json();
  const calendars: MicrosoftCalendar[] = data.value || [];

  return calendars.map((cal) => ({
    id: cal.id,
    name: cal.name,
    color: cal.color,
    isPrimary: cal.isDefaultCalendar || false,
    provider: 'microsoft' as CalendarProvider,
  }));
};

export const fetchMicrosoftCalendarEvents = async (
  accessToken: string,
  calendarId?: string,
  startDateTime?: Date,
  endDateTime?: Date,
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({
    $orderby: 'start/dateTime',
    $top: '250',
  });

  if (startDateTime && endDateTime) {
    params.set('startDateTime', startDateTime.toISOString());
    params.set('endDateTime', endDateTime.toISOString());
  }

  const endpoint = calendarId
    ? `${MICROSOFT_GRAPH_API}/me/calendars/${calendarId}/calendarView?${params}`
    : `${MICROSOFT_GRAPH_API}/me/calendarView?${params}`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch Microsoft calendar events');
  }

  const data = await response.json();
  const events: MicrosoftCalendarEvent[] = data.value || [];

  return events.map(microsoftEventToCalendarEvent);
};

// ============= UNIFIED CALENDAR FETCHING =============

export const fetchAllCalendarEvents = async (
  provider: CalendarProvider,
  accessToken: string,
  startDate?: Date,
  endDate?: Date,
): Promise<CalendarEvent[]> => {
  switch (provider) {
    case 'google':
      return fetchGoogleCalendarEvents(accessToken, 'primary', startDate, endDate);
    case 'microsoft':
      return fetchMicrosoftCalendarEvents(accessToken, undefined, startDate, endDate);
    case 'apple':
      // Apple Calendar requires native EventKit on iOS
      // For now, return empty array - will implement with native module
      console.warn('Apple Calendar import requires native iOS implementation');
      return [];
    default:
      return [];
  }
};

export const fetchCalendars = async (
  provider: CalendarProvider,
  accessToken: string,
): Promise<Calendar[]> => {
  switch (provider) {
    case 'google':
      return fetchGoogleCalendars(accessToken);
    case 'microsoft':
      return fetchMicrosoftCalendars(accessToken);
    case 'apple':
      // Apple Calendar requires native EventKit on iOS
      console.warn('Apple Calendar import requires native iOS implementation');
      return [];
    default:
      return [];
  }
};

