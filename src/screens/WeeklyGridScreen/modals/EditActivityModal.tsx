import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { clearExceptionsCache } from '@/services/database/activityService';
import { createExceptionsForWeeks } from '@/services/database/exceptionService';
import { Activity, DayOfWeek, dayNames, dayOrder } from '@/types/schedule';

import { ACTIVITY_COLORS } from '../constants';
import { styles } from '../styles';
import { formatTimeInput, isValidTime } from '../utils';

export type EditActivityModalProps = {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
  onSave: (activity: Activity & { days?: DayOfWeek[] }) => Promise<string | null>;
  onDelete: (activityId: string) => Promise<void>;
  colors: any;
  weekOffset?: number;
  onRefreshExceptions?: () => Promise<void>;
};

export const EditActivityModal = ({
  visible,
  activity,
  onClose,
  onSave,
  onDelete,
  colors,
  onRefreshExceptions,
}: EditActivityModalProps) => {
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(new Set([DayOfWeek.Monday]));
  const [selectedColor, setSelectedColor] = useState(ACTIVITY_COLORS[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [skipWeeks, setSkipWeeks] = useState(0);

  useEffect(() => {
    if (activity && visible) {
      setName(activity.name);
      setSelectedDays(new Set([activity.day]));
      setSelectedColor(activity.color);
      setIsRecurring(activity.isRecurring);
      setStartTime(activity.startTime);
      setEndTime(activity.endTime);
      setLocation(activity.location || '');
      setDescription(activity.description || '');
      setTimeError('');
      setIsSaving(false);
      setIsDeleting(false);
      setSkipWeeks(0);
    }
  }, [activity, visible]);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        if (newSet.size > 1) {
          newSet.delete(day);
        }
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

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
    setTimeError('');
    return true;
  };

  const handleSave = async () => {
    if (!activity || !name.trim()) return;
    if (!validateTimes()) return;

    setIsSaving(true);
    setTimeError('');

    const days = Array.from(selectedDays);
    const error = await onSave({
      ...activity,
      name: name.trim(),
      day: days[0],
      days: days.length > 1 ? days : undefined,
      color: selectedColor,
      isRecurring,
      startTime,
      endTime,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
    });

    if (error) {
      setTimeError(error);
      setIsSaving(false);
      return;
    }

    if (isRecurring && activity.isRecurring && skipWeeks > 0) {
      try {
        if (skipWeeks > 0 && skipWeeks <= 52) {
          for (const day of selectedDays) {
            await createExceptionsForWeeks(activity.id, day, skipWeeks);
          }
          clearExceptionsCache();
          if (onRefreshExceptions) {
            await onRefreshExceptions();
          }
        }
      } catch (err) {
        console.error('Failed to create recurrence exceptions:', err);
      }
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
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Days</Text>
              <Text style={[styles.toggleHint, { color: colors.placeholder, marginBottom: 8 }]}>
                Select one or more days
              </Text>
              <View style={styles.daySelector}>
                {dayOrder.map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.daySelectorButton,
                      { backgroundColor: colors.inputBackground },
                      selectedDays.has(day) && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.daySelectorText,
                        { color: colors.textSecondary },
                        selectedDays.has(day) && { color: '#ffffff' },
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

            {activity.isRecurring && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                  Skip recurrence for
                </Text>
                <View style={styles.counterRow}>
                  <Pressable
                    style={[
                      styles.counterButton,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        opacity: skipWeeks <= 0 ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => setSkipWeeks(Math.max(0, skipWeeks - 1))}
                    disabled={skipWeeks <= 0}
                  >
                    <Ionicons name="remove" size={20} color={colors.textSecondary} />
                  </Pressable>
                  <View
                    style={[
                      styles.counterValue,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.counterText, { color: colors.textPrimary }]}>{skipWeeks}</Text>
                    <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>
                      {skipWeeks === 1 ? 'week' : 'weeks'}
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.counterButton,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        opacity: skipWeeks >= 52 ? 0.5 : 1,
                      },
                    ]}
                    onPress={() => setSkipWeeks(Math.min(52, skipWeeks + 1))}
                    disabled={skipWeeks >= 52}
                  >
                    <Ionicons name="add" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Text style={[styles.toggleHint, { color: colors.placeholder, marginTop: 4 }]}>
                  {skipWeeks > 0
                    ? `This activity will be cancelled for the next ${skipWeeks} ${skipWeeks === 1 ? 'week' : 'weeks'}`
                    : 'Set how many weeks to skip this recurring activity'}
                </Text>
              </View>
            )}

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
                        borderColor:
                          timeError && !isValidTime(startTime) ? colors.error || '#EF4444' : colors.inputBorder,
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
                        borderColor:
                          timeError && !isValidTime(endTime) ? colors.error || '#EF4444' : colors.inputBorder,
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

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Location (Optional)</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                ]}
                placeholder="e.g., Gym, Office, Home"
                placeholderTextColor={colors.placeholder}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description (Optional)</Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                    minHeight: 80,
                    textAlignVertical: 'top',
                    paddingTop: 12,
                  },
                ]}
                placeholder="Add any additional details..."
                placeholderTextColor={colors.placeholder}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

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
                  backgroundColor:
                    name.trim() && startTime && endTime && !isSaving && !isDeleting
                      ? colors.primary
                      : colors.inputBackground,
                  opacity: isSaving || isDeleting ? 0.7 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={!name.trim() || !startTime || !endTime || isSaving || isDeleting}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  { color: name.trim() && startTime && endTime ? '#ffffff' : colors.placeholder },
                ]}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
