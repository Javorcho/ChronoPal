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

import { DatePickerField } from '@/components/DatePickerField';
import {
  dateToDayOfWeek,
  DayOfWeek,
  dayNames,
  dayOrder,
  formatDateToISO,
} from '@/types/schedule';

import { ACTIVITY_COLORS } from '../constants';
import { styles } from '../styles';
import { formatTimeInput, getWeekDateRange, isValidTime } from '../utils';
import { MiniCalendarPicker } from '../views/MiniCalendarPicker';

export type AddActivityModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (activity: {
    name: string;
    day?: DayOfWeek;
    days?: DayOfWeek[];
    color: string;
    isRecurring: boolean;
    startTime: string;
    endTime: string;
    activityDate?: string;
    weekOffset?: number;
    recurrenceEndDate?: string;
    location?: string;
    description?: string;
  }) => Promise<string | null>;
  colors: any;
  mode?: 'weekly' | 'monthly';
  monthOffset?: number;
  weekOffset?: number;
};

export const AddActivityModal = ({
  visible,
  onClose,
  onSave,
  colors,
  mode = 'weekly',
  monthOffset = 0,
  weekOffset: initialWeekOffset = 0,
}: AddActivityModalProps) => {
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(new Set([DayOfWeek.Monday]));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedColor, setSelectedColor] = useState(ACTIVITY_COLORS[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [timeError, setTimeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(monthOffset);
  const [weekOffset, setWeekOffset] = useState(initialWeekOffset);
  const [recurrenceDuration, setRecurrenceDuration] = useState<'forever' | 'weeks' | 'until'>('forever');
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(4);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) {
      setWeekOffset(initialWeekOffset);
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialWeekOffset]);

  const reset = () => {
    setName('');
    setSelectedDate(null);
    setDatePickerMonth(monthOffset);
    setWeekOffset(initialWeekOffset);
    setSelectedDays(new Set([DayOfWeek.Monday]));
    setSelectedColor(ACTIVITY_COLORS[0]);
    setIsRecurring(false);
    setStartTime('');
    setEndTime('');
    setLocation('');
    setDescription('');
    setTimeError('');
    setIsSaving(false);
    setRecurrenceDuration('forever');
    setRecurrenceWeeks(4);
    setRecurrenceEndDate(null);
  };

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

  // Allow overnight activities where end < start
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
    if (!name.trim()) return;
    if (!validateTimes()) return;

    if (mode === 'monthly' && !selectedDate) {
      setTimeError('Please select a date');
      return;
    }

    setIsSaving(true);
    setTimeError('');

    if (mode === 'monthly' && selectedDate) {
      const day = dateToDayOfWeek(selectedDate);
      const activityDate = formatDateToISO(selectedDate);
      const error = await onSave({
        name: name.trim(),
        day,
        color: selectedColor,
        isRecurring: false,
        startTime,
        endTime,
        activityDate,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });
      if (error) {
        setTimeError(error);
        setIsSaving(false);
        return;
      }
      reset();
      onClose();
      return;
    }

    let calculatedRecurrenceEndDate: string | undefined;
    if (isRecurring && recurrenceDuration !== 'forever') {
      if (recurrenceDuration === 'weeks') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + recurrenceWeeks * 7);
        calculatedRecurrenceEndDate = formatDateToISO(endDate);
      } else if (recurrenceDuration === 'until' && recurrenceEndDate) {
        calculatedRecurrenceEndDate = formatDateToISO(recurrenceEndDate);
      }
    }

    const days = Array.from(selectedDays);
    const error = await onSave({
      name: name.trim(),
      days,
      color: selectedColor,
      isRecurring,
      startTime,
      endTime,
      weekOffset: isRecurring ? undefined : weekOffset,
      recurrenceEndDate: calculatedRecurrenceEndDate,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
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

            {mode === 'weekly' ? (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Days</Text>

                <View style={[styles.weekNavContainerModal, { marginBottom: 12 }]}>
                  <Pressable
                    style={[styles.weekNavButtonModal, { backgroundColor: colors.inputBackground }]}
                    onPress={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                    disabled={weekOffset === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={weekOffset === 0 ? colors.placeholder : colors.textSecondary}
                    />
                  </Pressable>
                  <Text style={[styles.weekNavTextModal, { color: colors.textPrimary }]}>
                    {getWeekDateRange(weekOffset)}
                  </Text>
                  <Pressable
                    style={[styles.weekNavButtonModal, { backgroundColor: colors.inputBackground }]}
                    onPress={() => setWeekOffset((prev) => prev + 1)}
                  >
                    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                  </Pressable>
                </View>

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
            ) : (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Select Date</Text>
                <MiniCalendarPicker
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  monthOffset={datePickerMonth}
                  onPrevMonth={() => setDatePickerMonth((prev) => prev - 1)}
                  onNextMonth={() => setDatePickerMonth((prev) => prev + 1)}
                  colors={colors}
                />
              </View>
            )}

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

            {mode === 'weekly' && (
              <>
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

                {isRecurring && (
                  <View style={styles.formGroup}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                      Repeat Duration
                    </Text>

                    <View style={styles.recurrenceDurationRow}>
                      <Pressable
                        style={[
                          styles.recurrenceDurationOption,
                          {
                            backgroundColor: recurrenceDuration === 'forever' ? colors.primary + '20' : colors.inputBackground,
                            borderColor: recurrenceDuration === 'forever' ? colors.primary : colors.inputBorder,
                          },
                        ]}
                        onPress={() => setRecurrenceDuration('forever')}
                      >
                        <Text style={[styles.recurrenceDurationText, { color: colors.textPrimary }]}>Forever</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.recurrenceDurationOption,
                          {
                            backgroundColor: recurrenceDuration === 'weeks' ? colors.primary + '20' : colors.inputBackground,
                            borderColor: recurrenceDuration === 'weeks' ? colors.primary : colors.inputBorder,
                          },
                        ]}
                        onPress={() => setRecurrenceDuration('weeks')}
                      >
                        <Text style={[styles.recurrenceDurationText, { color: colors.textPrimary }]}>For weeks</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.recurrenceDurationOption,
                          {
                            backgroundColor: recurrenceDuration === 'until' ? colors.primary + '20' : colors.inputBackground,
                            borderColor: recurrenceDuration === 'until' ? colors.primary : colors.inputBorder,
                          },
                        ]}
                        onPress={() => setRecurrenceDuration('until')}
                      >
                        <Text style={[styles.recurrenceDurationText, { color: colors.textPrimary }]}>Until date</Text>
                      </Pressable>
                    </View>

                    {recurrenceDuration === 'weeks' && (
                      <View style={[styles.formGroup, { marginTop: 12 }]}>
                        <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                          Number of weeks
                        </Text>
                        <View style={styles.weeksInputRow}>
                          <Pressable
                            style={[styles.weeksButton, { backgroundColor: colors.inputBackground }]}
                            onPress={() => setRecurrenceWeeks(Math.max(1, recurrenceWeeks - 1))}
                          >
                            <Ionicons name="remove" size={20} color={colors.textPrimary} />
                          </Pressable>
                          <TextInput
                            style={[
                              styles.weeksInput,
                              {
                                backgroundColor: colors.inputBackground,
                                borderColor: colors.inputBorder,
                                color: colors.textPrimary,
                              },
                            ]}
                            value={recurrenceWeeks.toString()}
                            onChangeText={(text) => {
                              const num = parseInt(text, 10);
                              if (!isNaN(num) && num > 0) {
                                setRecurrenceWeeks(num);
                              } else if (text === '') {
                                setRecurrenceWeeks(1);
                              }
                            }}
                            keyboardType="numeric"
                            textAlign="center"
                          />
                          <Pressable
                            style={[styles.weeksButton, { backgroundColor: colors.inputBackground }]}
                            onPress={() => setRecurrenceWeeks(recurrenceWeeks + 1)}
                          >
                            <Ionicons name="add" size={20} color={colors.textPrimary} />
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {recurrenceDuration === 'until' && (
                      <View style={[styles.formGroup, { marginTop: 12 }]}>
                        <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
                          End date
                        </Text>
                        <DatePickerField
                          value={recurrenceEndDate}
                          onChange={setRecurrenceEndDate}
                          placeholder="Select end date"
                          minDate={(() => {
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setHours(0, 0, 0, 0);
                            return tomorrow;
                          })()}
                        />
                        {recurrenceEndDate && (
                          <Pressable
                            style={styles.clearDateButton}
                            onPress={() => setRecurrenceEndDate(null)}
                          >
                            <Text style={[styles.clearDateText, { color: colors.error || '#EF4444' }]}>
                              Clear date
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </>
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
                  backgroundColor:
                    name.trim() && startTime && endTime && !isSaving ? colors.primary : colors.inputBackground,
                  opacity: isSaving ? 0.7 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={!name.trim() || !startTime || !endTime || isSaving}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  { color: name.trim() && startTime && endTime ? '#ffffff' : colors.placeholder },
                ]}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
