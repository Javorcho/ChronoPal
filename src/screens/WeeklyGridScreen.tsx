import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  Switch,
} from 'react-native';

import { useTheme } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Activity, dayNames, DayOfWeek, dayOrder } from '@/types/schedule';
import { subscribeToActivities, createActivity, updateActivity, removeActivity } from '@/services/activityService';
import { fetchGoogleCalendarEvents } from '@/services/calendarService';
import { getSessionWithToken } from '@/services/authService';

// Activity colors palette
const ACTIVITY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

// Inject custom scrollbar styles for web (weekly grid only)
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    /* Hide scrollbar on login/auth pages */
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none;
    }
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    /* Custom scrollbar for weekly grid */
    [data-weekly-grid-scroll]::-webkit-scrollbar {
      width: 8px;
    }
    [data-weekly-grid-scroll]::-webkit-scrollbar-track {
      background: transparent;
    }
    [data-weekly-grid-scroll]::-webkit-scrollbar-thumb {
      background: rgba(128, 128, 128, 0.3);
    }
    [data-weekly-grid-scroll]::-webkit-scrollbar-thumb:hover {
      background: rgba(128, 128, 128, 0.5);
    }
    [data-weekly-grid-scroll] {
      scrollbar-width: thin;
      scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
    }
  `;
  document.head.appendChild(style);
}

// Hook to add custom scrollbar attribute to ScrollView on web
const useWeeklyGridScrollbar = () => {
  const scrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    if (Platform.OS === 'web' && scrollRef.current) {
      // @ts-ignore - accessing DOM node on web
      const node = scrollRef.current as unknown as HTMLElement;
      if (node && node.setAttribute) {
        node.setAttribute('data-weekly-grid-scroll', 'true');
      }
    }
  }, []);
  
  return scrollRef;
};

// Breakpoint for mobile vs desktop
const MOBILE_BREAKPOINT = 768;

// Logout button with hover effect for web, always red icon on mobile
type LogoutButtonProps = {
  onPress: () => void;
  isMobile: boolean;
  colors: any;
};

const LogoutButton = ({ onPress, isMobile, colors }: LogoutButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getIconColor = () => {
    if (isMobile) {
      return colors.error || '#EF4444'; // Red icon on mobile
    }
    // Desktop: red on hover, normal otherwise
    return isHovered ? (colors.error || '#EF4444') : colors.textSecondary;
  };

  return (
    <Pressable
      style={styles.signOutButton}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons name="log-out-outline" size={20} color={getIconColor()} />
    </Pressable>
  );
};

// Close button with hover effect (red on hover)
type CloseButtonProps = {
  onPress: () => void;
  colors: any;
  style?: any;
};

const CloseButton = ({ onPress, colors, style }: CloseButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Pressable
      style={[
        styles.activitiesPanelClose, 
        { backgroundColor: isHovered ? '#FEE2E2' : colors.inputBackground },
        style
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons 
        name="close" 
        size={18} 
        color={isHovered ? '#EF4444' : colors.textSecondary} 
      />
    </Pressable>
  );
};

// Get current week's date range (Monday to Sunday)
const getWeekDateRange = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Adjust so Monday = 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const formatDate = (date: Date) => `${months[date.getMonth()]} ${date.getDate()}`;
  
  // If same month, show "Dec 16 - 22, 2025"
  if (monday.getMonth() === sunday.getMonth()) {
    return `${formatDate(monday)} - ${sunday.getDate()}, ${sunday.getFullYear()}`;
  }
  // If different months, show "Dec 30 - Jan 5, 2025"
  return `${formatDate(monday)} - ${formatDate(sunday)}, ${sunday.getFullYear()}`;
};

type WeeklyGridScreenProps = {
  onSignOut?: () => void;
};

// Add Activity Modal
type AddActivityModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (activity: {
    name: string;
    day: DayOfWeek;
    color: string;
    isRecurring: boolean;
    startTime: string;
    endTime: string;
  }) => Promise<string | null>; // Returns error message or null on success
  colors: any;
};

// Helper to parse time string (HH:MM) to minutes from midnight
const parseTime = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

// Helper to validate time format
const isValidTime = (timeStr: string): boolean => {
  return parseTime(timeStr) !== null;
};

// Helper to format time input (auto-add colon)
const formatTimeInput = (text: string): string => {
  // Remove non-digits
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
};

const AddActivityModal = ({ visible, onClose, onSave, colors }: AddActivityModalProps) => {
  const [name, setName] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Monday);
  const [selectedColor, setSelectedColor] = useState(ACTIVITY_COLORS[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setName('');
    setSelectedDay(DayOfWeek.Monday);
    setSelectedColor(ACTIVITY_COLORS[0]);
    setIsRecurring(false);
    setStartTime('');
    setEndTime('');
    setTimeError('');
    setIsSaving(false);
  };

  // Validate times
  const validateTimes = (): boolean => {
    if (!startTime && !endTime) {
      setTimeError('Please enter start and end times');
      return false;
    }
    if (!isValidTime(startTime)) {
      setTimeError('Invalid start time (use HH:MM format)');
      return false;
    }
    if (!isValidTime(endTime)) {
      setTimeError('Invalid end time (use HH:MM format)');
      return false;
    }
    const startMinutes = parseTime(startTime)!;
    const endMinutes = parseTime(endTime)!;
    if (endMinutes <= startMinutes) {
      setTimeError('End time must be after start time');
      return false;
    }
    setTimeError('');
    return true;
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (!validateTimes()) return;
    
    setIsSaving(true);
    setTimeError('');
    
    const error = await onSave({
      name: name.trim(),
      day: selectedDay,
      color: selectedColor,
      isRecurring,
      startTime,
      endTime,
    });
    
    if (error) {
      setTimeError(error);
      setIsSaving(false);
      return;
    }
    
    reset();
    onClose();
  };

  const handleStartTimeChange = (text: string) => {
    setStartTime(formatTimeInput(text));
    setTimeError('');
  };

  const handleEndTimeChange = (text: string) => {
    setEndTime(formatTimeInput(text));
    setTimeError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Activity</Text>
            <Pressable onPress={handleClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Activity Name</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Enter activity name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Day</Text>
              <View style={styles.daySelector}>
                {dayOrder.map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.daySelectorButton,
                      { backgroundColor: colors.inputBackground },
                      selectedDay === day && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.daySelectorText,
                        { color: colors.textSecondary },
                        selectedDay === day && { color: '#ffffff' },
                      ]}
                    >
                      {dayNames[day]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Color</Text>
              <View style={styles.colorSelector}>
                {ACTIVITY_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    Recurring
                  </Text>
                  <Text style={[styles.toggleHint, { color: colors.placeholder }]}>Repeat every week</Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: colors.inputBackground, true: colors.primary + '60' }}
                  thumbColor={isRecurring ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Time</Text>
              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: timeError && !isValidTime(startTime) ? colors.error || '#EF4444' : colors.inputBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="09:00"
                    placeholderTextColor={colors.placeholder}
                    value={startTime}
                    onChangeText={handleStartTimeChange}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: timeError && !isValidTime(endTime) ? colors.error || '#EF4444' : colors.inputBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="17:00"
                    placeholderTextColor={colors.placeholder}
                    value={endTime}
                    onChangeText={handleEndTimeChange}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
              {timeError ? (
                <Text style={[styles.timeError, { color: colors.error || '#EF4444' }]}>{timeError}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.inputBackground }]}
              onPress={handleClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalButton,
                styles.modalButtonSave,
                { 
                  backgroundColor: name.trim() && startTime && endTime && !isSaving 
                    ? colors.primary 
                    : colors.inputBackground,
                  opacity: isSaving ? 0.7 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={!name.trim() || !startTime || !endTime || isSaving}
            >
              <Text style={[styles.modalButtonText, { color: name.trim() && startTime && endTime ? '#ffffff' : colors.placeholder }]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Edit Activity Modal
type EditActivityModalProps = {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
  onSave: (activity: Activity) => Promise<string | null>;
  onDelete: (activityId: string) => Promise<void>;
  colors: any;
};

const EditActivityModal = ({ visible, activity, onClose, onSave, onDelete, colors }: EditActivityModalProps) => {
  const [name, setName] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Monday);
  const [selectedColor, setSelectedColor] = useState(ACTIVITY_COLORS[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load activity data when modal opens
  useEffect(() => {
    if (activity && visible) {
      setName(activity.name);
      setSelectedDay(activity.day);
      setSelectedColor(activity.color);
      setIsRecurring(activity.isRecurring);
      setStartTime(activity.startTime);
      setEndTime(activity.endTime);
      setTimeError('');
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [activity, visible]);

  const validateTimes = (): boolean => {
    if (!startTime && !endTime) {
      setTimeError('Please enter start and end times');
      return false;
    }
    if (!isValidTime(startTime)) {
      setTimeError('Invalid start time (use HH:MM format)');
      return false;
    }
    if (!isValidTime(endTime)) {
      setTimeError('Invalid end time (use HH:MM format)');
      return false;
    }
    const startMinutes = parseTime(startTime)!;
    const endMinutes = parseTime(endTime)!;
    if (endMinutes <= startMinutes) {
      setTimeError('End time must be after start time');
      return false;
    }
    setTimeError('');
    return true;
  };

  const handleSave = async () => {
    if (!activity || !name.trim()) return;
    if (!validateTimes()) return;
    
    setIsSaving(true);
    setTimeError('');
    
    const error = await onSave({
      ...activity,
      name: name.trim(),
      day: selectedDay,
      color: selectedColor,
      isRecurring,
      startTime,
      endTime,
    });
    
    if (error) {
      setTimeError(error);
      setIsSaving(false);
      return;
    }
    
    onClose();
  };

  const handleDelete = async () => {
    if (!activity) return;
    setIsDeleting(true);
    await onDelete(activity.id);
    setIsDeleting(false);
    onClose();
  };

  const handleStartTimeChange = (text: string) => {
    setStartTime(formatTimeInput(text));
    setTimeError('');
  };

  const handleEndTimeChange = (text: string) => {
    setEndTime(formatTimeInput(text));
    setTimeError('');
  };

  if (!activity) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Activity</Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Activity Name</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="Enter activity name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Day</Text>
              <View style={styles.daySelector}>
                {dayOrder.map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.daySelectorButton,
                      { backgroundColor: colors.inputBackground },
                      selectedDay === day && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.daySelectorText,
                        { color: colors.textSecondary },
                        selectedDay === day && { color: '#ffffff' },
                      ]}
                    >
                      {dayNames[day]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Color</Text>
              <View style={styles.colorSelector}>
                {ACTIVITY_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    Recurring
                  </Text>
                  <Text style={[styles.toggleHint, { color: colors.placeholder }]}>Repeat every week</Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: colors.inputBackground, true: colors.primary + '60' }}
                  thumbColor={isRecurring ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Time</Text>
              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Start</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: timeError && !isValidTime(startTime) ? colors.error || '#EF4444' : colors.inputBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="09:00"
                    placeholderTextColor={colors.placeholder}
                    value={startTime}
                    onChangeText={handleStartTimeChange}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>End</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: timeError && !isValidTime(endTime) ? colors.error || '#EF4444' : colors.inputBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="17:00"
                    placeholderTextColor={colors.placeholder}
                    value={endTime}
                    onChangeText={handleEndTimeChange}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
              {timeError ? (
                <Text style={[styles.timeError, { color: colors.error || '#EF4444' }]}>{timeError}</Text>
              ) : null}
            </View>

            {/* Delete Button */}
            <Pressable
              style={[styles.deleteButton, { backgroundColor: (colors.error || '#EF4444') + '15' }]}
              onPress={handleDelete}
              disabled={isDeleting || isSaving}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error || '#EF4444'} />
              <Text style={[styles.deleteButtonText, { color: colors.error || '#EF4444' }]}>
                {isDeleting ? 'Deleting...' : 'Delete Activity'}
              </Text>
            </Pressable>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.inputBackground }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalButton,
                styles.modalButtonSave,
                { 
                  backgroundColor: name.trim() && startTime && endTime && !isSaving && !isDeleting
                    ? colors.primary 
                    : colors.inputBackground,
                  opacity: isSaving || isDeleting ? 0.7 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={!name.trim() || !startTime || !endTime || isSaving || isDeleting}
            >
              <Text style={[styles.modalButtonText, { color: name.trim() && startTime && endTime ? '#ffffff' : colors.placeholder }]}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const WeeklyGridScreen = ({ onSignOut }: WeeklyGridScreenProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < MOBILE_BREAKPOINT;
  const user = useAuthStore((state) => state.user);

  // Activities state (from Supabase)
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selected day for mobile expanded view
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  
  // Mobile navigation tab state
  const [mobileActiveTab, setMobileActiveTab] = useState<'calendar' | 'add'>('calendar');
  
  // Add activity modal state
  const [showAddActivity, setShowAddActivity] = useState(false);
  
  // Edit activity modal state
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Desktop activities panel state
  const [showActivitiesPanel, setShowActivitiesPanel] = useState(false);
  
  // Google Calendar import state
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);

  // Subscribe to activities from Supabase
  useEffect(() => {
    if (!user?.uid) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToActivities(user.uid, (fetchedActivities) => {
      setActivities(fetchedActivities);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  // Get current day
  const today = new Date();
  const dayIndex = today.getDay();
  const currentDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const currentDay = dayOrder[currentDayIndex];

  // Handle day press
  const handleDayPress = (day: DayOfWeek) => {
    if (isMobile) {
      setSelectedDay(day);
    }
  };

  // Handle back from expanded view
  const handleBack = () => {
    setSelectedDay(null);
  };
  
  // Handle add activity (open modal)
  const handleAddActivity = () => {
    setShowAddActivity(true);
  };

  // Check if new activity overlaps with existing ones
  const checkTimeConflict = (
    day: DayOfWeek,
    startTime: string,
    endTime: string
  ): string | null => {
    const newStart = parseTime(startTime);
    const newEnd = parseTime(endTime);
    if (newStart === null || newEnd === null) return null;

    const dayActivities = activities.filter((a) => a.day === day);
    
    for (const existing of dayActivities) {
      const existingStart = parseTime(existing.startTime);
      const existingEnd = parseTime(existing.endTime);
      if (existingStart === null || existingEnd === null) continue;

      // Check for overlap: new activity starts before existing ends AND new activity ends after existing starts
      if (newStart < existingEnd && newEnd > existingStart) {
        return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
      }
    }
    return null;
  };

  // Save activity to Supabase
  const handleSaveActivity = async (activity: {
    name: string;
    day: DayOfWeek;
    color: string;
    isRecurring: boolean;
    startTime: string;
    endTime: string;
  }): Promise<string | null> => {
    if (!user?.uid) return 'Not logged in';

    // Check for time conflicts
    const conflict = checkTimeConflict(activity.day, activity.startTime, activity.endTime);
    if (conflict) {
      return conflict;
    }

    try {
      await createActivity({
        userId: user.uid,
        name: activity.name,
        day: activity.day,
        color: activity.color,
        isRecurring: activity.isRecurring,
        startTime: activity.startTime,
        endTime: activity.endTime,
      });
      // Activities will update automatically via subscription
    } catch (error) {
      console.error('Failed to create activity:', error);
      return 'Failed to save activity';
    }
    
    setShowAddActivity(false);
    setMobileActiveTab('calendar');
    return null;
  };
  
  // Handle tab change
  const handleTabChange = (tab: 'calendar' | 'add') => {
    setMobileActiveTab(tab);
    if (tab === 'calendar') {
      setShowAddActivity(false);
    }
  };

  // Handle activity click (open edit modal)
  const handleActivityClick = (activity: Activity) => {
    setEditingActivity(activity);
  };

  // Update activity in Supabase
  const handleUpdateActivity = async (activity: Activity): Promise<string | null> => {
    if (!user?.uid) return 'Not logged in';

    // Check for time conflicts (excluding the current activity)
    const otherActivities = activities.filter((a) => a.id !== activity.id && a.day === activity.day);
    const newStart = parseTime(activity.startTime);
    const newEnd = parseTime(activity.endTime);
    
    if (newStart !== null && newEnd !== null) {
      for (const existing of otherActivities) {
        const existingStart = parseTime(existing.startTime);
        const existingEnd = parseTime(existing.endTime);
        if (existingStart === null || existingEnd === null) continue;

        if (newStart < existingEnd && newEnd > existingStart) {
          return `Conflicts with "${existing.name}" (${existing.startTime} - ${existing.endTime})`;
        }
      }
    }

    try {
      await updateActivity(activity.id, {
        name: activity.name,
        day: activity.day,
        color: activity.color,
        isRecurring: activity.isRecurring,
        startTime: activity.startTime,
        endTime: activity.endTime,
      });
      // Activities will update automatically via subscription
    } catch (error) {
      console.error('Failed to update activity:', error);
      return 'Failed to update activity';
    }
    
    setEditingActivity(null);
    return null;
  };

  // Delete activity from Supabase
  const handleDeleteActivity = async (activityId: string): Promise<void> => {
    try {
      await removeActivity(activityId);
      // Activities will update automatically via subscription
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
    setEditingActivity(null);
  };

  // Import events from Google Calendar
  const handleImportGoogleCalendar = async () => {
    if (!user?.uid) {
      setImportError('Please sign in first');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      // Get the session with provider token
      const session = await getSessionWithToken();
      
      if (!session?.providerToken) {
        setImportError('Please sign in with Google to import calendar events');
        setIsImporting(false);
        return;
      }

      // Get current week's start and end dates
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      // Fetch events from Google Calendar
      const googleEvents = await fetchGoogleCalendarEvents(
        session.providerToken,
        'primary',
        weekStart,
        weekEnd
      );

      if (googleEvents.length === 0) {
        setImportSuccess(0);
        setIsImporting(false);
        return;
      }

      // Convert and import events
      let importedCount = 0;
      
      for (const event of googleEvents) {
        // Skip all-day events for now (they don't have specific times)
        if (event.isAllDay) continue;
        
        // Parse the event times
        const startDate = new Date(event.startTime);
        const endDate = new Date(event.endTime);
        
        // Get the day of week
        const eventDayIndex = startDate.getDay();
        const dayIndex = eventDayIndex === 0 ? 6 : eventDayIndex - 1;
        const day = dayOrder[dayIndex];
        
        // Format times as HH:MM
        const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        
        // Check if this event already exists (by name, day, and time)
        const exists = activities.some(
          (a) => a.name === event.title && a.day === day && a.startTime === startTime && a.endTime === endTime
        );
        
        if (exists) continue;

        // Create the activity
        try {
          await createActivity({
            userId: user.uid,
            name: event.title,
            day,
            color: '#4285F4', // Google blue for imported events
            isRecurring: false,
            startTime,
            endTime,
          });
          importedCount++;
        } catch (err) {
          console.error('Failed to import event:', event.title, err);
        }
      }

      setImportSuccess(importedCount);
    } catch (error) {
      console.error('Failed to import Google Calendar:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import calendar');
    }

    setIsImporting(false);
  };

  // Clear import messages after a delay
  useEffect(() => {
    if (importSuccess !== null || importError) {
      const timer = setTimeout(() => {
        setImportSuccess(null);
        setImportError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess, importError]);

  // Mobile expanded single day view
  if (isMobile && selectedDay) {
    return (
      <>
        <MobileDayExpanded
          day={selectedDay}
          isToday={selectedDay === currentDay}
          onBack={handleBack}
          onSignOut={onSignOut}
          activities={activities.filter((a) => a.day === selectedDay)}
          onActivityClick={handleActivityClick}
        />
        <AddActivityModal
          visible={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onSave={handleSaveActivity}
          colors={colors}
        />
        <EditActivityModal
          visible={editingActivity !== null}
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          colors={colors}
        />
      </>
    );
  }

  // Mobile compact list view
  if (isMobile) {
    return (
      <>
        <MobileWeekList
          currentDay={currentDay}
          onDayPress={handleDayPress}
          onSignOut={onSignOut}
          onAddActivity={handleAddActivity}
          activities={activities}
          activeTab={mobileActiveTab}
          onTabChange={handleTabChange}
          onActivityClick={handleActivityClick}
          onImportGoogleCalendar={handleImportGoogleCalendar}
          isImporting={isImporting}
          importError={importError}
          importSuccess={importSuccess}
        />
        <AddActivityModal
          visible={showAddActivity}
          onClose={() => setShowAddActivity(false)}
          onSave={handleSaveActivity}
          colors={colors}
        />
        <EditActivityModal
          visible={editingActivity !== null}
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          colors={colors}
        />
      </>
    );
  }

  // Desktop horizontal grid
  return (
    <>
      <DesktopWeekGrid
        currentDay={currentDay}
        onSignOut={onSignOut}
        onAddActivity={handleAddActivity}
        activities={activities}
        onActivityClick={handleActivityClick}
        showActivitiesPanel={showActivitiesPanel}
        onToggleActivitiesPanel={() => setShowActivitiesPanel(!showActivitiesPanel)}
        onImportGoogleCalendar={handleImportGoogleCalendar}
        isImporting={isImporting}
        importError={importError}
        importSuccess={importSuccess}
      />
      <AddActivityModal
        visible={showAddActivity}
        onClose={() => setShowAddActivity(false)}
        onSave={handleSaveActivity}
        colors={colors}
      />
      <EditActivityModal
        visible={editingActivity !== null}
        activity={editingActivity}
        onClose={() => setEditingActivity(null)}
        onSave={handleUpdateActivity}
        onDelete={handleDeleteActivity}
        colors={colors}
      />
    </>
  );
};

// ===========================================
// MOBILE: Compact List View (days as rows)
// ===========================================
type MobileWeekListProps = {
  currentDay: DayOfWeek;
  onDayPress: (day: DayOfWeek) => void;
  onSignOut?: () => void;
  onAddActivity?: () => void;
  activities: Activity[];
  activeTab: 'calendar' | 'add';
  onTabChange: (tab: 'calendar' | 'add') => void;
  onActivityClick?: (activity: Activity) => void;
  onImportGoogleCalendar?: () => void;
  isImporting?: boolean;
  importError?: string | null;
  importSuccess?: number | null;
};

const MobileWeekList = ({ currentDay, onDayPress, onSignOut, onAddActivity, activeTab, onTabChange, activities, onActivityClick, onImportGoogleCalendar, isImporting, importError, importSuccess }: MobileWeekListProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  // Animation value for sliding (0 = calendar, 1 = add)
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Swipe threshold (25% of screen width)
  const SWIPE_THRESHOLD = screenWidth * 0.25;
  
  // Pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      // Calculate the slide position based on gesture
      const currentValue = activeTab === 'calendar' ? 0 : 1;
      const gestureProgress = -gestureState.dx / screenWidth;
      const newValue = Math.max(0, Math.min(1, currentValue + gestureProgress));
      slideAnim.setValue(newValue);
    },
    onPanResponderRelease: (_, gestureState) => {
      // Determine if we should complete the swipe or snap back
      if (gestureState.dx < -SWIPE_THRESHOLD && activeTab === 'calendar') {
        // Swipe left - go to add
        onTabChange('add');
      } else if (gestureState.dx > SWIPE_THRESHOLD && activeTab === 'add') {
        // Swipe right - go to calendar
        onTabChange('calendar');
      } else {
        // Snap back to current tab
        Animated.spring(slideAnim, {
          toValue: activeTab === 'calendar' ? 0 : 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }).start();
      }
    },
  });
  
  // Animate when tab changes
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'calendar' ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [activeTab, slideAnim]);
  
  // Calculate slide transforms
  const calendarTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenWidth],
  });
  
  const addTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenWidth, 0],
  });

  // Darker header color for contrast with day panels
  const headerColor = colors.background === '#0f172a' ? '#0a1121' : '#e2e8f0';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with curved nav notch */}
      <View style={styles.headerWithNav}>
        <View style={[styles.header, { backgroundColor: headerColor }]}>
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {getWeekDateRange()}
              </Text>
            </View>
            {onSignOut && (
              <LogoutButton onPress={onSignOut} isMobile={true} colors={colors} />
            )}
          </View>
        </View>

        {/* Curved Notch Navigation */}
        <View style={styles.navNotchContainer}>
          <View style={[styles.navNotchCurve, { backgroundColor: headerColor }]}>
            <Pressable
              style={styles.navNotchButton}
              onPress={() => onTabChange('calendar')}
            >
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={activeTab === 'calendar' ? colors.primary : colors.textSecondary} 
              />
            </Pressable>
            <Pressable
              style={styles.navNotchButton}
              onPress={() => {
                onTabChange('add');
                onAddActivity?.();
              }}
            >
              <Ionicons 
                name="add" 
                size={22} 
                color={activeTab === 'add' ? colors.primary : colors.textSecondary} 
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Sliding Content Container */}
      <View style={styles.slidingContainer} {...panResponder.panHandlers}>
        {/* Calendar View (Days List) */}
        <Animated.View 
          style={[
            styles.slidingView,
            { transform: [{ translateX: calendarTranslateX }] }
          ]}
        >
          <View style={styles.mobileListFull}>
            {dayOrder.map((day, index) => {
              const isToday = day === currentDay;
              const isLast = index === dayOrder.length - 1;
              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayRowTimeline,
                    { 
                      backgroundColor: colors.card,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: colors.border,
                    },
                    isToday && { backgroundColor: colors.primary + '08' },
                  ]}
                  onPress={() => onDayPress(day)}
                >
                  {/* Day Label */}
                  <View style={styles.dayLabelSection}>
                    <Text
                      style={[
                        styles.dayLabelText,
                        { color: isToday ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {dayNames[day]}
                    </Text>
                    {isToday && (
                      <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                    )}
                  </View>

                  {/* Timeline Bar - 24h day representation */}
                  <View style={[styles.timelineBar, { backgroundColor: colors.inputBackground }]}>
                    {activities
                      .filter((a) => a.day === day)
                      .map((a) => {
                        const startMinutes = parseTime(a.startTime);
                        const endMinutes = parseTime(a.endTime);
                        if (startMinutes === null || endMinutes === null) return null;
                        
                        // Timeline represents full 24 hours (0:00 to 24:00)
                        const TIMELINE_START = 0; // 12 AM in minutes
                        const TIMELINE_END = 24 * 60; // 12 AM next day in minutes
                        const TIMELINE_DURATION = TIMELINE_END - TIMELINE_START;
                        
                        // Calculate position as percentage
                        const leftPercent = Math.max(0, ((startMinutes - TIMELINE_START) / TIMELINE_DURATION) * 100);
                        const widthPercent = Math.min(100 - leftPercent, ((endMinutes - startMinutes) / TIMELINE_DURATION) * 100);
                        
                        return (
                          <View
                            key={a.id}
                            style={[
                              styles.timelineActivityPositioned,
                              {
                                backgroundColor: a.color,
                                left: `${leftPercent}%`,
                                width: `${Math.max(widthPercent, 3)}%`,
                              },
                            ]}
                          />
                        );
                      })}
                  </View>

                  {/* Chevron */}
                  <View style={styles.chevronSection}>
                    <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Add Activity View */}
        <Animated.View 
          style={[
            styles.slidingView,
            styles.slidingViewAbsolute,
            { transform: [{ translateX: addTranslateX }] }
          ]}
        >
          <View style={[styles.addActivityView, { backgroundColor: colors.background }]}>
            {/* Action Buttons at Top */}
            <View style={styles.mobileActionButtons}>
              <Pressable 
                style={[styles.newActivityButtonTop, { backgroundColor: colors.primary }]}
                onPress={onAddActivity}
              >
                <Ionicons name="add-circle" size={22} color="#ffffff" />
                <Text style={styles.newActivityButtonTopText}>New Activity</Text>
              </Pressable>
              
              {/* Import from Google Calendar */}
              {onImportGoogleCalendar && (
                <Pressable 
                  style={[
                    styles.importCalendarButtonMobile, 
                    { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: isImporting ? 0.6 : 1,
                    }
                  ]}
                  onPress={onImportGoogleCalendar}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <Ionicons name="sync" size={20} color="#4285F4" />
                  ) : (
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                  )}
                  <Text style={[styles.importCalendarButtonMobileText, { color: colors.textPrimary }]}>
                    {isImporting ? 'Importing...' : 'Import from Google'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Import Status Messages */}
            {importError && (
              <View style={[styles.importMessageMobile, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={[styles.importMessageMobileText, { color: '#DC2626' }]}>{importError}</Text>
              </View>
            )}
            {importSuccess !== null && importSuccess !== undefined && (
              <View style={[styles.importMessageMobile, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#059669" />
                <Text style={[styles.importMessageMobileText, { color: '#059669' }]}>
                  {importSuccess === 0 ? 'No events to import' : `Imported ${importSuccess} event${importSuccess > 1 ? 's' : ''}`}
                </Text>
              </View>
            )}

            {/* Activities List */}
            <ScrollView 
              style={styles.activitiesListScroll}
              contentContainerStyle={styles.activitiesListContent}
              showsVerticalScrollIndicator={false}
            >
              {activities.length === 0 ? (
                <View style={styles.emptyActivitiesList}>
                  <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                  <Text style={[styles.emptyActivitiesTitle, { color: colors.textSecondary }]}>
                    No activities yet
                  </Text>
                  <Text style={[styles.emptyActivitiesSubtitle, { color: colors.placeholder }]}>
                    Tap the button above to create one
                  </Text>
                </View>
              ) : (
                activities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    style={[styles.activityListItem, { backgroundColor: colors.card }]}
                    onPress={() => onActivityClick?.(activity)}
                  >
                    <View style={[styles.activityListColorBar, { backgroundColor: activity.color }]} />
                    <View style={styles.activityListInfo}>
                      <Text style={[styles.activityListName, { color: colors.textPrimary }]}>
                        {activity.name}
                      </Text>
                      <View style={styles.activityListMeta}>
                        <Text style={[styles.activityListDay, { color: colors.textSecondary }]}>
                          {dayNames[activity.day]}
                        </Text>
                        <Text style={[styles.activityListTime, { color: colors.placeholder }]}>
                          {activity.startTime} - {activity.endTime}
                        </Text>
                        {activity.isRecurring && (
                          <View style={styles.activityListRecurring}>
                            <Ionicons name="repeat" size={12} color={colors.primary} />
                          </View>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.placeholder} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

// ===========================================
// MOBILE: Expanded Single Day View (column)
// ===========================================
type MobileDayExpandedProps = {
  day: DayOfWeek;
  isToday: boolean;
  onBack: () => void;
  onSignOut?: () => void;
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
};

const MobileDayExpanded = ({ day, isToday, onBack, activities, onActivityClick }: MobileDayExpandedProps) => {
  const { colors } = useTheme();

  const FULL_DAY_NAMES: Record<DayOfWeek, string> = {
    [DayOfWeek.Monday]: 'Monday',
    [DayOfWeek.Tuesday]: 'Tuesday',
    [DayOfWeek.Wednesday]: 'Wednesday',
    [DayOfWeek.Thursday]: 'Thursday',
    [DayOfWeek.Friday]: 'Friday',
    [DayOfWeek.Saturday]: 'Saturday',
    [DayOfWeek.Sunday]: 'Sunday',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.expandedHeaderContent}>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.expandedHeaderCenter}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {FULL_DAY_NAMES[day]}
            </Text>
            {isToday && (
              <View style={[styles.todayBadgeLarge, { backgroundColor: colors.primary }]}>
                <Text style={styles.todayBadgeText}>Today</Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Day Column Content */}
      <ScrollView
        style={styles.expandedContent}
        contentContainerStyle={styles.expandedContentInner}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.expandedDayColumn,
            { backgroundColor: colors.card },
            isToday && { borderColor: colors.primary, borderWidth: 2 },
          ]}
        >
          {/* Day Header */}
          <View
            style={[
              styles.expandedDayHeader,
              isToday && { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Text
              style={[
                styles.expandedDayName,
                { color: isToday ? colors.primary : colors.textSecondary },
              ]}
            >
              {dayNames[day]}
            </Text>
          </View>

          {/* Activities Area */}
          <View style={styles.expandedActivitiesArea}>
        {activities.length === 0 ? (
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No activities</Text>
            <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
              Activities will appear here
            </Text>
          </View>
        ) : (
          activities.map((activity) => (
            <Pressable
              key={activity.id}
              style={[styles.dayActivityItem, { backgroundColor: colors.card }]}
              onPress={() => onActivityClick?.(activity)}
            >
              <View style={[styles.dayActivityColorBar, { backgroundColor: activity.color }]} />
              <View style={styles.dayActivityInfo}>
                <Text style={[styles.dayActivityName, { color: colors.textPrimary }]}>
                  {activity.name}
                </Text>
                <View style={styles.dayActivityMeta}>
                  <Text style={[styles.dayActivityTime, { color: colors.textSecondary }]}>
                    {activity.startTime || 'Start'} - {activity.endTime || 'End'}
                  </Text>
                  {activity.isRecurring && (
                    <View style={styles.recurringBadge}>
                      <Ionicons name="repeat" size={12} color={colors.primary} />
                      <Text style={[styles.recurringText, { color: colors.primary }]}>Weekly</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ===========================================
// DESKTOP: Horizontal Grid (columns)
// ===========================================
type DesktopWeekGridProps = {
  currentDay: DayOfWeek;
  onSignOut?: () => void;
  onAddActivity?: () => void;
  activities: Activity[];
  onActivityClick?: (activity: Activity) => void;
  showActivitiesPanel: boolean;
  onToggleActivitiesPanel: () => void;
  onImportGoogleCalendar?: () => void;
  isImporting?: boolean;
  importError?: string | null;
  importSuccess?: number | null;
};

// Generate time slots from 12am to 11pm (full 24 hours)
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return { hour, label: `${displayHour} ${ampm}` };
});

const HOUR_HEIGHT = 50; // Height of each hour slot in pixels

const DesktopWeekGrid = ({ currentDay, onSignOut, onAddActivity, activities, onActivityClick, showActivitiesPanel, onToggleActivitiesPanel, onImportGoogleCalendar, isImporting, importError, importSuccess }: DesktopWeekGridProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useWeeklyGridScrollbar();
  const TIME_GUTTER_WIDTH = 56;
  const GAP = 8;
  const PADDING = 16;
  const PANEL_WIDTH = showActivitiesPanel ? 320 : 0;
  const DAY_COLUMN_WIDTH = Math.max((screenWidth - TIME_GUTTER_WIDTH - PADDING * 2 - GAP * 6 - PANEL_WIDTH) / 7, 100);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {getWeekDateRange()}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Import status messages */}
            {importError && (
              <View style={[styles.importMessage, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={[styles.importMessageText, { color: '#DC2626' }]}>{importError}</Text>
              </View>
            )}
            {importSuccess !== null && importSuccess !== undefined && (
              <View style={[styles.importMessage, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={[styles.importMessageText, { color: '#059669' }]}>
                  {importSuccess === 0 ? 'No events to import' : `Imported ${importSuccess} event${importSuccess > 1 ? 's' : ''}`}
                </Text>
              </View>
            )}
            
            {/* Import from Google Calendar button */}
            {onImportGoogleCalendar && (
              <Pressable
                style={[
                  styles.importCalendarButton, 
                  { 
                    backgroundColor: colors.inputBackground,
                    opacity: isImporting ? 0.6 : 1,
                  }
                ]}
                onPress={onImportGoogleCalendar}
                disabled={isImporting}
              >
                {isImporting ? (
                  <Ionicons name="sync" size={18} color={colors.textSecondary} />
                ) : (
                  <Ionicons name="calendar" size={18} color={colors.textSecondary} />
                )}
                <Text style={[styles.importCalendarButtonText, { color: colors.textSecondary }]}>
                  {isImporting ? 'Importing...' : 'Import Calendar'}
                </Text>
              </Pressable>
            )}
            
            <Pressable
              style={[
                styles.myActivitiesButton, 
                { 
                  backgroundColor: showActivitiesPanel ? colors.primary : colors.inputBackground,
                }
              ]}
              onPress={onToggleActivitiesPanel}
            >
              <Ionicons 
                name="list" 
                size={18} 
                color={showActivitiesPanel ? '#ffffff' : colors.textSecondary} 
              />
              <Text style={[
                styles.myActivitiesButtonText, 
                { color: showActivitiesPanel ? '#ffffff' : colors.textSecondary }
              ]}>
                My Activities
              </Text>
            </Pressable>
            {onAddActivity && (
              <Pressable
                style={[styles.addActivityDesktopButton, { backgroundColor: colors.primary }]}
                onPress={onAddActivity}
              >
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.addActivityDesktopButtonText}>Add Activity</Text>
              </Pressable>
            )}
            {onSignOut && (
              <LogoutButton onPress={onSignOut} isMobile={false} colors={colors} />
            )}
          </View>
        </View>
      </View>

      {/* Time Grid with Day Columns */}
      <View style={styles.desktopGridWrapper}>
        {/* Time Gutter - for header alignment */}
        <View style={{ width: TIME_GUTTER_WIDTH }} />
        
        {/* Day Columns with Headers */}
        <View style={[styles.dayColumnsWrapper, { gap: GAP }]}>
          {dayOrder.map((day) => {
            const isToday = day === currentDay;
            return (
              <View
                key={day}
                style={[
                  styles.desktopDayColumnFull,
                  { 
                    width: DAY_COLUMN_WIDTH,
                    backgroundColor: colors.card,
                  },
                  isToday && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                {/* Day Header */}
                <View
                  style={[
                    styles.desktopDayHeader,
                    isToday && { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayName,
                      { color: isToday ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {dayNames[day]}
                  </Text>
                  {isToday && (
                    <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.todayText}>Today</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Scrollable Time Grid */}
      <ScrollView
        ref={scrollRef}
        style={styles.desktopGridScroll}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.desktopGridRow}>
          {/* Time Labels Column */}
          <View style={[styles.timeGutter, { width: TIME_GUTTER_WIDTH }]}>
            {TIME_SLOTS.map((slot) => (
              <View key={slot.hour} style={[styles.timeGutterSlot, { height: HOUR_HEIGHT }]}>
                <Text style={[styles.timeGutterLabel, { color: colors.textSecondary }]}>
                  {slot.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Day Columns Grid */}
          <View style={[styles.dayColumnsWrapper, { gap: GAP }]}>
            {dayOrder.map((day) => {
              const isToday = day === currentDay;
              const dayActivities = activities.filter((a) => a.day === day);
              // Grid starts at 12 AM (hour 0)
              const GRID_START_HOUR = 0;
              return (
                <View
                  key={day}
                  style={[
                    styles.desktopDayColumnGrid,
                    { 
                      width: DAY_COLUMN_WIDTH,
                      backgroundColor: colors.card,
                    },
                    isToday && { 
                      backgroundColor: colors.primary + '08',
                      borderLeftColor: colors.primary,
                      borderRightColor: colors.primary,
                      borderLeftWidth: 2,
                      borderRightWidth: 2,
                    },
                  ]}
                >
                  {/* Activity blocks positioned absolutely */}
                  {dayActivities.map((a) => {
                    const startMinutes = parseTime(a.startTime);
                    const endMinutes = parseTime(a.endTime);
                    if (startMinutes === null || endMinutes === null) return null;
                    
                    // Calculate top position (relative to grid start, plus 8px padding)
                    const startHoursFromGridStart = (startMinutes / 60) - GRID_START_HOUR;
                    const top = startHoursFromGridStart * HOUR_HEIGHT + 8;
                    
                    // Calculate height based on duration
                    const durationMinutes = endMinutes - startMinutes;
                    const height = (durationMinutes / 60) * HOUR_HEIGHT;
                    
                    // Skip if activity is outside visible range
                    if (top < 0 || top > TIME_SLOTS.length * HOUR_HEIGHT) return null;
                    
                    return (
                      <Pressable
                        key={a.id}
                        style={[
                          styles.desktopActivityBlock,
                          {
                            backgroundColor: a.color,
                            top,
                            height: Math.max(height, 24), // Minimum height for visibility
                            left: 2,
                            right: 2,
                          },
                        ]}
                        onPress={() => onActivityClick?.(a)}
                      >
                        <Text style={styles.desktopActivityBlockName} numberOfLines={2}>
                          {a.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                  {TIME_SLOTS.map((slot) => (
                    <View
                      key={slot.hour}
                      style={[
                        styles.desktopHourCell,
                        { 
                          height: HOUR_HEIGHT,
                          borderTopColor: colors.border,
                          borderTopWidth: 1,
                        },
                      ]}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Stats */}
      {(() => {
        // Calculate total hours for the week
        const totalMinutes = activities.reduce((sum, a) => {
          const start = parseTime(a.startTime);
          const end = parseTime(a.endTime);
          if (start !== null && end !== null) {
            return sum + (end - start);
          }
          return sum;
        }, 0);
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal

        // Count recurring activities
        const recurringCount = activities.filter((a) => a.isRecurring).length;

        // Count today's activities
        const todayCount = activities.filter((a) => a.day === currentDay).length;

        return (
          <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalHours}h</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This week</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
            <View style={styles.statItem}>
              <Ionicons name="repeat-outline" size={18} color={colors.secondary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{recurringCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recurring</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
            <View style={styles.statItem}>
              <Ionicons name="today-outline" size={18} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{todayCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
            </View>
          </View>
        );
      })()}

      {/* Activities Panel */}
      {showActivitiesPanel && (
        <View style={[styles.activitiesPanel, { backgroundColor: colors.card, borderLeftColor: colors.border }]}>
          <View style={styles.activitiesPanelHeader}>
            <View style={styles.activitiesPanelHeaderTop}>
              <Text style={[styles.activitiesPanelTitle, { color: colors.textPrimary }]}>
                My Activities
              </Text>
              <CloseButton onPress={onToggleActivitiesPanel} colors={colors} />
            </View>
            <Text style={[styles.activitiesPanelCount, { color: colors.textSecondary }]}>
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
            </Text>
          </View>
          
          <ScrollView 
            style={styles.activitiesPanelScroll}
            showsVerticalScrollIndicator={false}
          >
            {activities.length === 0 ? (
              <View style={styles.activitiesPanelEmpty}>
                <Ionicons name="calendar-outline" size={40} color={colors.placeholder} />
                <Text style={[styles.activitiesPanelEmptyText, { color: colors.textSecondary }]}>
                  No activities yet
                </Text>
              </View>
            ) : (
              activities.map((activity) => (
                <Pressable
                  key={activity.id}
                  style={[styles.activitiesPanelItem, { backgroundColor: colors.inputBackground }]}
                  onPress={() => onActivityClick?.(activity)}
                >
                  <View style={[styles.activitiesPanelItemColor, { backgroundColor: activity.color }]} />
                  <View style={styles.activitiesPanelItemInfo}>
                    <Text style={[styles.activitiesPanelItemName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {activity.name}
                    </Text>
                    <View style={styles.activitiesPanelItemMeta}>
                      <Text style={[styles.activitiesPanelItemDay, { color: colors.textSecondary }]}>
                        {dayNames[activity.day]}
                      </Text>
                      <Text style={[styles.activitiesPanelItemTime, { color: colors.placeholder }]}>
                        {activity.startTime} - {activity.endTime}
                      </Text>
                      {activity.isRecurring && (
                        <Ionicons name="repeat" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// ===========================================
// STYLES
// ===========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expandedHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandedHeaderCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addActivityDesktopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addActivityDesktopButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  myActivitiesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  myActivitiesButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Import Calendar Button
  importCalendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  importCalendarButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  importMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  importMessageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Activities Panel (Desktop)
  activitiesPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    borderLeftWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 40 : 20,
  },
  activitiesPanelHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  activitiesPanelHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activitiesPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  activitiesPanelClose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activitiesPanelCount: {
    fontSize: 13,
  },
  activitiesPanelScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  activitiesPanelEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  activitiesPanelEmptyText: {
    fontSize: 14,
  },
  activitiesPanelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  activitiesPanelItemColor: {
    width: 4,
    height: '100%',
    minHeight: 54,
  },
  activitiesPanelItemInfo: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  activitiesPanelItemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activitiesPanelItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activitiesPanelItemDay: {
    fontSize: 12,
    fontWeight: '500',
  },
  activitiesPanelItemTime: {
    fontSize: 11,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header with curved nav notch
  headerWithNav: {
    position: 'relative',
    zIndex: 10,
  },
  
  // Curved Notch Navigation (wide shallow arc)
  navNotchContainer: {
    alignItems: 'center',
    marginTop: -1,
  },
  navNotchCurve: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '65%',
    paddingBottom: 6,
    height: 32,
    borderBottomLeftRadius: 150,
    borderBottomRightRadius: 150,
    gap: 16,
  },
  navNotchButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonCancel: {},
  modalButtonSave: {},

  // Form Styles
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  daySelectorButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  daySelectorText: {
    fontSize: 13,
    fontWeight: '600',
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
  timeError: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 6,
  },

  // Sliding Container & Views
  slidingContainer: {
    flex: 1,
    overflow: 'hidden',
    marginTop: 12,
  },
  slidingView: {
    flex: 1,
    width: '100%',
  },
  slidingViewAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Add Activity View
  addActivityView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  newActivityButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginBottom: 16,
  },
  newActivityButtonTopText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mobileActionButtons: {
    gap: 12,
    marginBottom: 8,
  },
  importCalendarButtonMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  importCalendarButtonMobileText: {
    fontSize: 15,
    fontWeight: '600',
  },
  importMessageMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  importMessageMobileText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  activitiesListScroll: {
    flex: 1,
  },
  activitiesListContent: {
    paddingBottom: 20,
  },
  emptyActivitiesList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyActivitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyActivitiesSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  activityListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  activityListColorBar: {
    width: 4,
    height: '100%',
    minHeight: 60,
  },
  activityListInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  activityListName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityListDay: {
    fontSize: 13,
    fontWeight: '500',
  },
  activityListTime: {
    fontSize: 12,
  },
  activityListRecurring: {
    marginLeft: 4,
  },
  addActivityContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  addActivityIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addActivityTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  addActivitySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,
  },
  addActivityButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Mobile List View
  mobileList: {
    flex: 1,
  },
  mobileListContent: {
    padding: 16,
    gap: 12,
  },
  mobileListContentSmooth: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  mobileListFull: {
    flex: 1,
  },
  dayRowFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dayRowTimeline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  dayLabelSection: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  timelineBar: {
    flex: 1,
    height: '70%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineActivityPositioned: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  timelineActivity: {
    flex: 1,
    maxWidth: 20,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  chevronSection: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dayRowSmooth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dayRowFirst: {
    // Full width, no rounding
  },
  dayRowLast: {
    // Full width, no rounding
  },
  dayRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dayIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconContainerSmooth: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayIconText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayRowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayRowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  dayRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activityCountSmooth: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activityCountText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Mobile Expanded View
  expandedContent: {
    flex: 1,
  },
  expandedContentInner: {
    padding: 16,
    paddingBottom: 24,
  },
  expandedDayColumn: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  expandedDayHeader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  expandedDayName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  expandedActivitiesArea: {
    flex: 1,
    padding: 16,
    minHeight: 300,
  },
  emptyDay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
  },
  // Expanded day activity items
  dayActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  dayActivityColorBar: {
    width: 5,
    height: '100%',
    minHeight: 70,
  },
  dayActivityInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  dayActivityName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  dayActivityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayActivityTime: {
    fontSize: 14,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '500',
  },
  todayBadgeLarge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  // Desktop Grid - Time Grid Layout
  desktopGridWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dayColumnsWrapper: {
    flexDirection: 'row',
    flex: 1,
  },
  desktopDayColumnFull: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  desktopDayHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  desktopGridScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  desktopGridRow: {
    flexDirection: 'row',
  },
  timeGutter: {
    paddingTop: 8,
  },
  timeGutterSlot: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  timeGutterLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -7,
  },
  desktopDayColumnGrid: {
    // No border radius - connects to header above
    position: 'relative',
    paddingTop: 8,
  },
  desktopHourCell: {
    position: 'relative',
  },
  desktopActivityBlock: {
    position: 'absolute',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopActivityBlockName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  desktopActivitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 4,
  },
  desktopActivityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  desktopActivityChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Legacy styles (keeping for backwards compatibility)
  gridContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  dayColumn: {
    minHeight: 300,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  dayHeader: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dayContent: {
    flex: 1,
  },
  timeSlotCell: {
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  timeSlotLabel: {
    fontSize: 9,
    fontWeight: '500',
  },
  emptyDaySmall: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
});

