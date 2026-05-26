import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Activity, dayNames } from '@/types/schedule';

import { styles } from '../styles';

// =============================================================================
// LogoutButton
// =============================================================================
type LogoutButtonProps = {
  onPress: () => void;
  isMobile: boolean;
  colors: any;
};

export const LogoutButton = ({ onPress, isMobile, colors }: LogoutButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getIconColor = () => {
    if (isMobile) {
      return colors.error || '#EF4444';
    }
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

// =============================================================================
// CloseButton (close button with red-on-hover effect)
// =============================================================================
type CloseButtonProps = {
  onPress: () => void;
  colors: any;
  style?: any;
};

export const CloseButton = ({ onPress, colors, style }: CloseButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.activitiesPanelClose,
        { backgroundColor: isHovered ? '#FEE2E2' : colors.inputBackground },
        style,
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

// =============================================================================
// ActivityPanelItem (single row in the activities side panel)
// =============================================================================
type ActivityPanelItemProps = {
  activity: Activity;
  onPress: () => void;
  colors: any;
};

export const ActivityPanelItem = ({ activity, onPress, colors }: ActivityPanelItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.activitiesPanelItem,
        {
          backgroundColor: isHovered ? activity.color + '20' : colors.inputBackground,
          transform: isHovered ? [{ scale: 1.02 }] : [{ scale: 1 }],
        },
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <View
        style={[
          styles.activitiesPanelItemColor,
          {
            backgroundColor: activity.color,
            width: isHovered ? 6 : 4,
          },
        ]}
      />
      <View style={styles.activitiesPanelItemInfo}>
        <Text
          style={[
            styles.activitiesPanelItemName,
            { color: isHovered ? activity.color : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
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
      {isHovered && (
        <Ionicons name="chevron-forward" size={16} color={activity.color} style={{ marginRight: 12 }} />
      )}
    </Pressable>
  );
};

// =============================================================================
// ImportCalendarButton
// =============================================================================
type ImportCalendarButtonProps = {
  onPress: () => void;
  isImporting: boolean;
  colors: any;
};

export const ImportCalendarButton = ({ onPress, isImporting, colors }: ImportCalendarButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.importCalendarButton,
        {
          backgroundColor: isHovered ? colors.primary + '20' : colors.inputBackground,
          opacity: isImporting ? 0.6 : 1,
          borderWidth: isHovered ? 1 : 0,
          borderColor: colors.primary,
        },
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      disabled={isImporting}
    >
      {isImporting ? (
        <Ionicons name="sync" size={18} color={isHovered ? colors.primary : colors.textSecondary} />
      ) : (
        <Ionicons name="calendar" size={18} color={isHovered ? colors.primary : colors.textSecondary} />
      )}
      <Text
        style={[
          styles.importCalendarButtonText,
          { color: isHovered ? colors.primary : colors.textSecondary },
        ]}
      >
        {isImporting ? 'Importing...' : 'Import Calendar'}
      </Text>
    </Pressable>
  );
};

// =============================================================================
// MyActivitiesButton (toggles activities side panel)
// =============================================================================
type MyActivitiesButtonProps = {
  onPress: () => void;
  isActive: boolean;
  colors: any;
};

export const MyActivitiesButton = ({ onPress, isActive, colors }: MyActivitiesButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundColor = () => {
    if (isActive) return colors.primary;
    if (isHovered) return colors.primary + '20';
    return colors.inputBackground;
  };

  const getTextColor = () => {
    if (isActive) return '#ffffff';
    if (isHovered) return colors.primary;
    return colors.textSecondary;
  };

  return (
    <Pressable
      style={[
        styles.myActivitiesButton,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: isHovered && !isActive ? 1 : 0,
          borderColor: colors.primary,
        },
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons name="list" size={18} color={getTextColor()} />
      <Text style={[styles.myActivitiesButtonText, { color: getTextColor() }]}>My Activities</Text>
    </Pressable>
  );
};

// =============================================================================
// AIHelperButton
// =============================================================================
type AIHelperButtonProps = {
  onPress: () => void;
  colors: any;
};

export const AIHelperButton = ({ onPress, colors }: AIHelperButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.aiHelperButton,
        {
          backgroundColor: isHovered ? colors.primary + '20' : colors.inputBackground,
          borderWidth: isHovered ? 1 : 0,
          borderColor: colors.primary,
        },
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons name="sparkles" size={18} color={isHovered ? colors.primary : colors.textSecondary} />
      <Text
        style={[
          styles.aiHelperButtonText,
          { color: isHovered ? colors.primary : colors.textSecondary },
        ]}
      >
        AI Helper
      </Text>
    </Pressable>
  );
};

// =============================================================================
// AddActivityButton (desktop)
// =============================================================================
type AddActivityButtonProps = {
  onPress: () => void;
  colors: any;
};

export const AddActivityButton = ({ onPress, colors }: AddActivityButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.addActivityDesktopButton,
        {
          backgroundColor: isHovered ? colors.primaryHover || '#7C3AED' : colors.primary,
          transform: isHovered ? [{ scale: 1.03 }] : [{ scale: 1 }],
        },
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons name="add" size={18} color="#ffffff" />
      <Text style={styles.addActivityDesktopButtonText}>Add Activity</Text>
    </Pressable>
  );
};

// =============================================================================
// WeekNavButton (chevron arrow used for week/month navigation)
// =============================================================================
type WeekNavButtonProps = {
  direction: 'prev' | 'next';
  onPress: () => void;
  colors: any;
};

export const WeekNavButton = ({ direction, onPress, colors }: WeekNavButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.weekNavButton,
        {
          backgroundColor: isHovered ? colors.primary + '20' : 'transparent',
        },
      ]}
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons
        name={direction === 'prev' ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={isHovered ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );
};

// =============================================================================
// ViewToggleButton (Weekly / Monthly switcher)
// =============================================================================
type ViewToggleButtonProps = {
  viewMode: 'weekly' | 'monthly';
  onToggle: () => void;
  colors: any;
};

export const ViewToggleButton = ({ viewMode, onToggle, colors }: ViewToggleButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      style={[
        styles.viewToggleButton,
        {
          backgroundColor: isHovered ? colors.primary + '20' : colors.inputBackground,
          borderColor: isHovered ? colors.primary : 'transparent',
          borderWidth: 1,
        },
      ]}
      onPress={onToggle}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <Ionicons
        name={viewMode === 'weekly' ? 'calendar-outline' : 'grid-outline'}
        size={16}
        color={isHovered ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.viewToggleText,
          { color: isHovered ? colors.primary : colors.textSecondary },
        ]}
      >
        {viewMode === 'weekly' ? 'Month' : 'Week'}
      </Text>
    </Pressable>
  );
};
