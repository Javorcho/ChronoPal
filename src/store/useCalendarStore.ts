import { create } from 'zustand';

import {
  CalendarReauthRequired,
  ensureGoogleCalendarToken,
  getSessionWithToken,
} from '@/services/auth/authService';
import { fetchAllCalendarEvents, fetchCalendars } from '@/services/integrations/calendarService';
import { Calendar, CalendarEvent, CalendarProvider } from '@/types/calendar';

type CalendarState = {
  calendars: Calendar[];
  events: CalendarEvent[];
  loading: boolean;
  error?: string;
  connectedProviders: CalendarProvider[];

  fetchCalendars: (provider: CalendarProvider) => Promise<void>;
  fetchEvents: (provider: CalendarProvider, startDate?: Date, endDate?: Date) => Promise<void>;
  importEvents: (events: CalendarEvent[]) => void;
  clearError: () => void;
};

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  calendars: [],
  events: [],
  loading: false,
  error: undefined,
  connectedProviders: [],

  fetchCalendars: async (provider: CalendarProvider) => {
    set({ loading: true, error: undefined });

    try {
      const accessToken =
        provider === 'google'
          ? await ensureGoogleCalendarToken()
          : (await getSessionWithToken())?.providerToken;

      if (!accessToken) {
        throw new Error(`Not connected to ${provider}. Please sign in with ${provider} first.`);
      }

      const calendars = await fetchCalendars(provider, accessToken);
      
      set((state) => ({
        calendars: [...state.calendars.filter((c) => c.provider !== provider), ...calendars],
        connectedProviders: state.connectedProviders.includes(provider)
          ? state.connectedProviders
          : [...state.connectedProviders, provider],
        loading: false,
      }));
    } catch (error) {
      const message =
        error instanceof CalendarReauthRequired
          ? 'Allow Google Calendar access in the prompt, then try again.'
          : (error as Error).message;
      set({ error: message, loading: false });
    }
  },

  fetchEvents: async (provider: CalendarProvider, startDate?: Date, endDate?: Date) => {
    set({ loading: true, error: undefined });

    try {
      const accessToken =
        provider === 'google'
          ? await ensureGoogleCalendarToken()
          : (await getSessionWithToken())?.providerToken;

      if (!accessToken) {
        throw new Error(`Not connected to ${provider}. Please sign in with ${provider} first.`);
      }

      // Default to current week if no dates provided
      const start = startDate || getStartOfWeek();
      const end = endDate || getEndOfWeek();

      const events = await fetchAllCalendarEvents(provider, accessToken, start, end);
      
      set((state) => ({
        events: [...state.events.filter((e) => e.provider !== provider), ...events],
        loading: false,
      }));
    } catch (error) {
      const message =
        error instanceof CalendarReauthRequired
          ? 'Allow Google Calendar access in the prompt, then try again.'
          : (error as Error).message;
      set({ error: message, loading: false });
    }
  },

  importEvents: (events: CalendarEvent[]) => {
    // This will be connected to the activity service to create activities
    console.log('Importing events:', events);
    // TODO: Convert calendar events to activities and save
  },

  clearError: () => {
    set({ error: undefined });
  },
}));

// Helper functions
const getStartOfWeek = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfWeek = (): Date => {
  const start = getStartOfWeek();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

