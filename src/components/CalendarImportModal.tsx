import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OAuthProvider } from '@/services/auth/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useTheme } from '@/store/useThemeStore';
import { CalendarEvent, CalendarProvider } from '@/types/calendar';

type Props = {
  visible: boolean;
  onClose: () => void;
  onImport: (events: CalendarEvent[]) => void;
};

const PROVIDERS: { id: CalendarProvider; name: string; icon: string; oauthId: OAuthProvider }[] = [
  { id: 'google', name: 'Google Calendar', icon: '📅', oauthId: 'google' },
  { id: 'microsoft', name: 'Outlook Calendar', icon: '📆', oauthId: 'azure' },
  { id: 'apple', name: 'Apple Calendar', icon: '🍎', oauthId: 'apple' },
];

export const CalendarImportModal = ({ visible, onClose, onImport }: Props) => {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const signInOAuth = useAuthStore((state) => state.signInOAuth);
  const oauthLoading = useAuthStore((state) => state.oauthLoading);

  const events = useCalendarStore((state) => state.events);
  const loading = useCalendarStore((state) => state.loading);
  const error = useCalendarStore((state) => state.error);
  const fetchEvents = useCalendarStore((state) => state.fetchEvents);
  const clearError = useCalendarStore((state) => state.clearError);

  const [selectedProvider, setSelectedProvider] = useState<CalendarProvider | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'provider' | 'events'>('provider');

  const handleProviderSelect = async (provider: CalendarProvider, oauthId: OAuthProvider) => {
    clearError();
    setSelectedProvider(provider);

    // Check if user is already authenticated with this provider
    if (user?.provider === oauthId) {
      // Already connected, fetch events
      await fetchEvents(provider);
      setStep('events');
    } else {
      // Need to sign in with OAuth first
      try {
        await signInOAuth(oauthId);
        await fetchEvents(provider);
        setStep('events');
      } catch (err) {
        // Error is handled by the store
      }
    }
  };

  const handleEventToggle = (eventId: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const providerEvents = events.filter((e) => e.provider === selectedProvider);
    if (selectedEvents.size === providerEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(providerEvents.map((e) => e.id)));
    }
  };

  const handleImport = () => {
    const eventsToImport = events.filter((e) => selectedEvents.has(e.id));
    onImport(eventsToImport);
    handleClose();
  };

  const handleClose = () => {
    setStep('provider');
    setSelectedProvider(null);
    setSelectedEvents(new Set());
    clearError();
    onClose();
  };

  const handleBack = () => {
    setStep('provider');
    setSelectedProvider(null);
    setSelectedEvents(new Set());
  };

  const providerEvents = events.filter((e) => e.provider === selectedProvider);

  const renderProviderButton = ({ id, name, icon, oauthId }: (typeof PROVIDERS)[number]) => {
    const isLoading = oauthLoading === oauthId || (loading && selectedProvider === id);
    const isDisabled = !!oauthLoading || loading;

    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.providerButton,
          { backgroundColor: colors.card, borderColor: colors.inputBorder },
          isDisabled && styles.providerButtonDisabled,
        ]}
        onPress={() => handleProviderSelect(id, oauthId)}
        disabled={isDisabled}
      >
        <Text style={styles.providerIcon}>{icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={[styles.providerName, { color: colors.textPrimary }]}>{name}</Text>
          <Text style={[styles.providerHint, { color: colors.textSecondary }]}>
            {id === 'apple' ? 'iOS only' : 'Tap to connect'}
          </Text>
        </View>
        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
      </TouchableOpacity>
    );
  };

  const renderEventItem = ({ item }: { item: CalendarEvent }) => {
    const isSelected = selectedEvents.has(item.id);
    const startDate = new Date(item.startTime);
    const endDate = new Date(item.endTime);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
      <Pressable
        style={[
          styles.eventItem,
          { backgroundColor: colors.card, borderColor: colors.inputBorder },
          isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
        ]}
        onPress={() => handleEventToggle(item.id)}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.inputBorder },
            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
        >
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
            {formatDate(startDate)} • {item.isAllDay ? 'All day' : `${formatTime(startDate)} - ${formatTime(endDate)}`}
          </Text>
          {item.location && (
            <Text style={[styles.eventLocation, { color: colors.textSecondary }]} numberOfLines={1}>
              📍 {item.location}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.inputBorder }]}>
            {step === 'events' && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {step === 'provider' ? 'Import Calendar' : 'Select Events'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Content */}
          {step === 'provider' ? (
            <View style={styles.providerList}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Connect a calendar to import events
              </Text>
              {PROVIDERS.map(renderProviderButton)}
            </View>
          ) : (
            <View style={styles.eventsList}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Fetching events...
                  </Text>
                </View>
              ) : providerEvents.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No events found for this week
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.selectAllContainer}>
                    <TouchableOpacity onPress={handleSelectAll}>
                      <Text style={[styles.selectAllText, { color: colors.primary }]}>
                        {selectedEvents.size === providerEvents.length ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.countText, { color: colors.textSecondary }]}>
                      {selectedEvents.size} of {providerEvents.length} selected
                    </Text>
                  </View>
                  <FlatList
                    data={providerEvents}
                    renderItem={renderEventItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                  />
                </>
              )}
            </View>
          )}

          {/* Footer */}
          {step === 'events' && providerEvents.length > 0 && (
            <View style={[styles.footer, { borderTopColor: colors.inputBorder }]}>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  { backgroundColor: colors.primary },
                  selectedEvents.size === 0 && styles.importButtonDisabled,
                ]}
                onPress={handleImport}
                disabled={selectedEvents.size === 0}
              >
                <Text style={styles.importButtonText}>
                  Import {selectedEvents.size} Event{selectedEvents.size !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    fontWeight: '500',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  providerList: {
    padding: 20,
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  providerButtonDisabled: {
    opacity: 0.6,
  },
  providerIcon: {
    fontSize: 32,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  providerHint: {
    fontSize: 13,
    marginTop: 2,
  },
  eventsList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countText: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  eventInfo: {
    flex: 1,
    gap: 4,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 13,
  },
  eventLocation: {
    fontSize: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  importButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

