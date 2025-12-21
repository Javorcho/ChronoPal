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
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { useTheme } from '@/store/useThemeStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Activity, dayNames, DayOfWeek, dayOrder } from '@/types/schedule';

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

// Activity colors palette
const ACTIVITY_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899', // Pink
];

// Add Activity Modal
type AddActivityModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (activity: {
    name: string;
    day: DayOfWeek;
    color: string;
    isRecurring: boolean;
  }) => void;
  colors: any;
};

const AddActivityModal = ({ visible, onClose, onSave, colors }: AddActivityModalProps) => {
  const [name, setName] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.Monday);
  const [selectedColor, setSelectedColor] = useState(ACTIVITY_COLORS[0]);
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        day: selectedDay,
        color: selectedColor,
        isRecurring,
      });
      // Reset form
      setName('');
      setSelectedDay(DayOfWeek.Monday);
      setSelectedColor(ACTIVITY_COLORS[0]);
      setIsRecurring(false);
      onClose();
    }
  };

  const handleClose = () => {
    // Reset form
    setName('');
    setSelectedDay(DayOfWeek.Monday);
    setSelectedColor(ACTIVITY_COLORS[0]);
    setIsRecurring(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              New Activity
            </Text>
            <Pressable onPress={handleClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Activity Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Activity Name
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  }
                ]}
                placeholder="Enter activity name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Day Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Day
              </Text>
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

            {/* Color Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Color
              </Text>
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
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recurring Toggle */}
            <View style={styles.formGroup}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    Recurring
                  </Text>
                  <Text style={[styles.toggleHint, { color: colors.placeholder }]}>
                    Repeat this activity every week
                  </Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: colors.inputBackground, true: colors.primary + '60' }}
                  thumbColor={isRecurring ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.inputBackground }]}
              onPress={handleClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalButton,
                styles.modalButtonSave,
                { backgroundColor: name.trim() ? colors.primary : colors.inputBackground },
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={[styles.modalButtonText, { color: name.trim() ? '#ffffff' : colors.placeholder }]}>
                Save
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
  onClose: () => void;
  onSave: (activity: {
    name: string;
    day: DayOfWeek;
    color: string;
    isRecurring: boolean;
  }) => void;
  colors: any;
  activity: Activity;
};

const EditActivityModal = ({ visible, onClose, onSave, colors, activity }: EditActivityModalProps) => {
  const [name, setName] = useState(activity.name);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(activity.day);
  const [selectedColor, setSelectedColor] = useState(activity.color);
  const [isRecurring, setIsRecurring] = useState(activity.isRecurring);

  // Update state when activity changes
  useEffect(() => {
    setName(activity.name);
    setSelectedDay(activity.day);
    setSelectedColor(activity.color);
    setIsRecurring(activity.isRecurring);
  }, [activity]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        name: name.trim(),
        day: selectedDay,
        color: selectedColor,
        isRecurring,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Edit Activity
            </Text>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Activity Name */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Activity Name
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  }
                ]}
                placeholder="Enter activity name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Day Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Day
              </Text>
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

            {/* Color Selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Color
              </Text>
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
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recurring Toggle */}
            <View style={styles.formGroup}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                    Recurring
                  </Text>
                  <Text style={[styles.toggleHint, { color: colors.placeholder }]}>
                    Repeat this activity every week
                  </Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: colors.inputBackground, true: colors.primary + '60' }}
                  thumbColor={isRecurring ? colors.primary : colors.textSecondary}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.inputBackground }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modalButton,
                styles.modalButtonSave,
                { backgroundColor: name.trim() ? colors.primary : colors.inputBackground },
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={[styles.modalButtonText, { color: name.trim() ? '#ffffff' : colors.placeholder }]}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  userId?: string;
};

export const WeeklyGridScreen = ({ onSignOut, userId }: WeeklyGridScreenProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < MOBILE_BREAKPOINT;
  
  // Initialize schedule store with userId
  const initializeStore = useScheduleStore((state) => state.initialize);
  const activities = useScheduleStore((state) => state.activities);
  
  useEffect(() => {
    if (userId) {
      initializeStore(userId);
    }
  }, [userId, initializeStore]);

  // Selected day for mobile expanded view
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  
  // Mobile navigation tab state
  const [mobileActiveTab, setMobileActiveTab] = useState<'calendar' | 'add'>('calendar');
  
  // Add activity modal state
  const [showAddActivity, setShowAddActivity] = useState(false);

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
  
  // Handle add activity
  const handleAddActivity = () => {
    setShowAddActivity(true);
  };
  
  // Handle tab change
  const handleTabChange = (tab: 'calendar' | 'add') => {
    setMobileActiveTab(tab);
    if (tab === 'calendar') {
      setShowAddActivity(false);
    }
  };

  // Mobile expanded single day view
  if (isMobile && selectedDay) {
    return (
      <MobileDayExpanded
        day={selectedDay}
        isToday={selectedDay === currentDay}
        onBack={handleBack}
        onSignOut={onSignOut}
        activities={activities.filter(a => a.day === selectedDay)}
      />
    );
  }

  // Mobile compact list view
  if (isMobile) {
    return (
      <MobileWeekList
        currentDay={currentDay}
        onDayPress={handleDayPress}
        onSignOut={onSignOut}
        onAddActivity={handleAddActivity}
        activeTab={mobileActiveTab}
        onTabChange={handleTabChange}
        userId={userId}
      />
    );
  }

  // Desktop horizontal grid
  return (
    <DesktopWeekGrid
      currentDay={currentDay}
      onSignOut={onSignOut}
    />
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
  activeTab: 'calendar' | 'add';
  onTabChange: (tab: 'calendar' | 'add') => void;
  userId?: string;
};

const MobileWeekList = ({ currentDay, onDayPress, onSignOut, onAddActivity, activeTab, onTabChange, userId }: MobileWeekListProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  // Get activities directly from store for reactivity
  const activities = useScheduleStore((state) => state.activities);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  
  // Store actions
  const addActivity = useScheduleStore((state) => state.addActivity);
  const removeActivity = useScheduleStore((state) => state.removeActivity);
  const updateActivity = useScheduleStore((state) => state.updateActivity);
  
  // Handle save activity
  const handleSaveActivity = async (activity: { name: string; day: DayOfWeek; color: string; isRecurring: boolean }) => {
    if (userId) {
      await addActivity({
        ...activity,
        userId: userId,
        startTime: '09:00',
        endTime: '10:00',
      });
      setShowAddModal(false);
    }
  };
  
  // Handle delete activity
  const handleDeleteActivity = async (id: string) => {
    try {
      await removeActivity(id);
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };
  
  // Handle edit activity
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setShowEditModal(true);
  };
  
  // Handle save edit
  const handleSaveEdit = async (updatedData: { name: string; day: DayOfWeek; color: string; isRecurring: boolean }) => {
    if (editingActivity) {
      await updateActivity(editingActivity.id, updatedData);
      setEditingActivity(null);
      setShowEditModal(false);
    }
  };
  
  // Get activities for a specific day
  const getActivitiesForDay = (day: DayOfWeek) => {
    return activities.filter(a => a.day === day);
  };
  
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

                  {/* Timeline Bar */}
                  <View style={[styles.timelineBar, { backgroundColor: colors.inputBackground }]}>
                    {getActivitiesForDay(day).map((activity) => (
                      <View
                        key={activity.id}
                        style={[styles.timelineActivity, { backgroundColor: activity.color }]}
                      />
                    ))}
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
          <View style={styles.activitiesContainer}>
            {/* Add Button at Top */}
            <Pressable 
              style={[styles.addActivityButtonTop, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={22} color="#ffffff" />
              <Text style={styles.addActivityButtonText}>New Activity</Text>
            </Pressable>

            {/* Activities List */}
            <ScrollView 
              style={styles.activitiesList}
              contentContainerStyle={styles.activitiesListContent}
              showsVerticalScrollIndicator={false}
            >
              {activities.length === 0 ? (
                <View style={styles.emptyActivities}>
                  <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                  <Text style={[styles.emptyActivitiesText, { color: colors.textSecondary }]}>
                    No activities yet
                  </Text>
                  <Text style={[styles.emptyActivitiesHint, { color: colors.placeholder }]}>
                    Tap the button above to create one
                  </Text>
                </View>
              ) : (
                activities.map((activity) => (
                  <View 
                    key={activity.id}
                    style={[styles.activityItem, { backgroundColor: colors.card }]}
                  >
                    <View style={[styles.activityColorBar, { backgroundColor: activity.color }]} />
                    <Pressable 
                      style={[styles.activityInfo, { flex: 1 }]}
                      onPress={() => handleEditActivity(activity)}
                    >
                      <Text style={[styles.activityName, { color: colors.textPrimary }]}>
                        {activity.name}
                      </Text>
                      <View style={styles.activityMeta}>
                        <Text style={[styles.activityDay, { color: colors.textSecondary }]}>
                          {dayNames[activity.day]}
                        </Text>
                        {activity.isRecurring && (
                          <View style={styles.recurringBadge}>
                            <Ionicons name="repeat" size={12} color={colors.primary} />
                            <Text style={[styles.recurringText, { color: colors.primary }]}>
                              Weekly
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                    <Pressable 
                      style={styles.activityDeleteButton}
                      onPress={() => handleDeleteActivity(activity.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error || '#EF4444'} />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      {/* Add Activity Modal */}
      <AddActivityModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveActivity}
        colors={colors}
      />

      {/* Edit Activity Modal */}
      {editingActivity && (
        <EditActivityModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingActivity(null);
          }}
          onSave={handleSaveEdit}
          colors={colors}
          activity={editingActivity}
        />
      )}
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
};

const MobileDayExpanded = ({ day, isToday, onBack, activities }: MobileDayExpandedProps) => {
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

      {/* Activities List */}
      <ScrollView
        style={styles.expandedContent}
        contentContainerStyle={styles.expandedContentInner}
        showsVerticalScrollIndicator={false}
      >
        {activities.length === 0 ? (
          <View style={[styles.expandedDayColumn, { backgroundColor: colors.card }]}>
            <View style={styles.expandedActivitiesArea}>
              <View style={styles.emptyDay}>
                <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  No activities
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.placeholder }]}>
                  Activities will appear here
                </Text>
              </View>
            </View>
          </View>
        ) : (
          activities.map((activity) => (
            <View
              key={activity.id}
              style={[styles.dayActivityItem, { backgroundColor: colors.card }]}
            >
              <View style={[styles.dayActivityColorBar, { backgroundColor: activity.color }]} />
              <View style={styles.dayActivityInfo}>
                <Text style={[styles.dayActivityName, { color: colors.textPrimary }]}>
                  {activity.name}
                </Text>
                <View style={styles.dayActivityMeta}>
                  <Text style={[styles.dayActivityTime, { color: colors.textSecondary }]}>
                    {activity.startTime} - {activity.endTime}
                  </Text>
                  {activity.isRecurring && (
                    <View style={styles.recurringBadge}>
                      <Ionicons name="repeat" size={12} color={colors.primary} />
                      <Text style={[styles.recurringText, { color: colors.primary }]}>Weekly</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
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
};

// Generate time slots from 6am to 10pm
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return { hour, label: `${displayHour} ${ampm}` };
});

const HOUR_HEIGHT = 50; // Height of each hour slot in pixels

const DesktopWeekGrid = ({ currentDay, onSignOut }: DesktopWeekGridProps) => {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useWeeklyGridScrollbar();
  const TIME_GUTTER_WIDTH = 56;
  const GAP = 8;
  const PADDING = 16;
  const DAY_COLUMN_WIDTH = Math.max((screenWidth - TIME_GUTTER_WIDTH - PADDING * 2 - GAP * 6) / 7, 100);

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
          {onSignOut && (
            <LogoutButton onPress={onSignOut} isMobile={false} colors={colors} />
          )}
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
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0h</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This week</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="repeat-outline" size={18} color={colors.secondary} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recurring</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.inputBorder }]} />
        <View style={styles.statItem}>
          <Ionicons name="today-outline" size={18} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
        </View>
      </View>
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
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
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
  addActivityButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },

  // Activities Container & List
  activitiesContainer: {
    flex: 1,
  },
  activitiesList: {
    flex: 1,
  },
  activitiesListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyActivities: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyActivitiesText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyActivitiesHint: {
    fontSize: 13,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  activityColorBar: {
    width: 4,
    height: '100%',
    minHeight: 60,
  },
  activityInfo: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityDay: {
    fontSize: 13,
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
  activityDeleteButton: {
    padding: 14,
  },

  // Day Expanded Activity Items
  dayActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
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
  dayActivityDeleteButton: {
    padding: 16,
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
    flexDirection: 'row',
    gap: 3,
    padding: 3,
  },
  timelineActivity: {
    flex: 1,
    borderRadius: 4,
    maxWidth: 30,
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
    paddingTop: 0,
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
  },
  desktopHourCell: {
    position: 'relative',
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
  modalButtonCancel: {},
  modalButtonSave: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

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
    width: 40,
    height: 40,
    borderRadius: 20,
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
});

