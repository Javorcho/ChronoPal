import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ActivityAction, generateSchedule, validateSchedule } from '@/services/ai/plannerService';
import { Activity, ActivityInput, dayNames, dayOrder } from '@/types/schedule';

import { styles } from '../styles';

export type AIPlannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onApprove: (activities: ActivityInput[]) => Promise<void>;
  recurringActivities: Activity[];
  allActivities: Activity[];
  weekStart: Date;
  colors: any;
  userId: string;
};

export const AIPlannerModal = ({
  visible,
  onClose,
  onApprove,
  recurringActivities,
  allActivities,
  weekStart,
  colors,
  userId,
}: AIPlannerModalProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedActivities, setGeneratedActivities] = useState<ActivityInput[]>([]);
  const [activityActions, setActivityActions] = useState<ActivityAction[]>([]);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; conflicts: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerateHovered, setIsGenerateHovered] = useState(false);
  const [isApproveHovered, setIsApproveHovered] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a schedule request');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedActivities([]);
    setActivityActions([]);
    setValidationResult(null);

    try {
      const actions = await generateSchedule(prompt, recurringActivities, weekStart, userId, allActivities);

      if (actions.length === 0) {
        setError(
          "The AI couldn't find any activities matching your request. Try rephrasing or check the activity names.",
        );
        setActivityActions([]);
        setGeneratedActivities([]);
        setValidationResult(null);
        return;
      }

      setActivityActions(actions);

      const displayActivities: ActivityInput[] = actions
        .filter((a) => a.action !== 'delete')
        .map((a) => ({
          name: a.name!,
          day: a.day!,
          startTime: a.startTime!,
          endTime: a.endTime!,
          color: a.color || '#3B82F6',
          isRecurring: Boolean(a.isRecurring),
          userId: a.userId || userId,
        }));

      setGeneratedActivities(displayActivities);

      // Deletes are always safe; only validate create/update conflicts
      const validation = validateSchedule(displayActivities, recurringActivities);
      setValidationResult(validation);
    } catch (err) {
      console.error('Failed to generate schedule:', err);
      setError('Failed to generate schedule. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deletedActivitiesPreview = activityActions
    .filter((a) => a.action === 'delete' && a.id)
    .map((a) => allActivities.find((act) => act.id === a.id))
    .filter((a): a is Activity => Boolean(a));

  const hasPendingChanges = activityActions.length > 0;
  const canApprove = hasPendingChanges && (validationResult === null || validationResult.valid);

  const handleApprove = async () => {
    if (activityActions.length === 0) return;

    try {
      await onApprove(activityActions as any);
      handleClose();
    } catch (err) {
      console.error('Failed to approve schedule:', err);
      setError('Failed to apply schedule changes. Please try again.');
    }
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedActivities([]);
    setActivityActions([]);
    setValidationResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>AI Schedule Planner</Text>
            <Pressable onPress={handleClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                Describe your schedule for this week
              </Text>
              <Text style={[styles.toggleHint, { color: colors.placeholder, marginBottom: 8 }]}>
                Example: &quot;Gym at 6am every day&quot; or &quot;Meetings 9-11am weekdays&quot;
              </Text>
              <TextInput
                style={[
                  styles.formInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                    minHeight: 100,
                    textAlignVertical: 'top',
                    paddingTop: 12,
                  },
                ]}
                placeholder="I want to go to the gym at 6am every weekday..."
                placeholderTextColor={colors.placeholder}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={4}
              />
            </View>

            <Pressable
              style={[
                styles.modalButton,
                styles.modalButtonSave,
                {
                  backgroundColor:
                    prompt.trim() && !isGenerating
                      ? isGenerateHovered
                        ? colors.primary + 'DD'
                        : colors.primary
                      : colors.inputBackground,
                  opacity: isGenerating ? 0.7 : 1,
                  borderWidth: isGenerateHovered && prompt.trim() && !isGenerating ? 1 : 0,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleGenerate}
              onHoverIn={() => setIsGenerateHovered(true)}
              onHoverOut={() => setIsGenerateHovered(false)}
              disabled={!prompt.trim() || isGenerating}
            >
              <Ionicons
                name={isGenerating ? 'hourglass' : 'sparkles'}
                size={18}
                color={prompt.trim() && !isGenerating ? '#ffffff' : colors.placeholder}
              />
              <Text
                style={[
                  styles.modalButtonText,
                  { color: prompt.trim() && !isGenerating ? '#ffffff' : colors.placeholder },
                ]}
              >
                {isGenerating ? 'Generating...' : 'Generate Schedule'}
              </Text>
            </Pressable>

            {error && (
              <View style={[styles.errorMessage, { backgroundColor: (colors.error || '#EF4444') + '15' }]}>
                <Ionicons name="alert-circle" size={16} color={colors.error || '#EF4444'} />
                <Text style={[styles.errorText, { color: colors.error || '#EF4444' }]}>{error}</Text>
              </View>
            )}

            {validationResult && !validationResult.valid && (
              <View style={[styles.errorMessage, { backgroundColor: (colors.error || '#EF4444') + '15' }]}>
                <Ionicons name="warning" size={16} color={colors.error || '#EF4444'} />
                <Text style={[styles.errorText, { color: colors.error || '#EF4444' }]}>
                  Conflicts detected:
                </Text>
                {validationResult.conflicts.map((conflict, idx) => (
                  <Text key={idx} style={[styles.errorText, { color: colors.error || '#EF4444', marginTop: 4 }]}>
                    • {conflict}
                  </Text>
                ))}
              </View>
            )}

            {hasPendingChanges && (
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary, marginBottom: 12 }]}>
                  Generated Schedule Preview
                </Text>
                {recurringActivities.length > 0 && (
                  <View style={[styles.recurringActivitiesInfo, { backgroundColor: colors.inputBackground + '80' }]}>
                    <Ionicons name="information-circle" size={16} color={colors.primary} />
                    <Text style={[styles.toggleHint, { color: colors.textSecondary, marginLeft: 8 }]}>
                      Your existing recurring activities will be preserved
                    </Text>
                  </View>
                )}

                {deletedActivitiesPreview.length > 0 && (
                  <View style={[styles.previewDayGroup, { marginBottom: 12 }]}>
                    <View style={[styles.previewDayHeader, { backgroundColor: (colors.error || '#EF4444') + '20' }]}>
                      <Text style={[styles.previewDayName, { color: colors.error || '#EF4444' }]}>To delete</Text>
                      <Text style={[styles.previewDayCount, { color: colors.error || '#EF4444' }]}>
                        {deletedActivitiesPreview.length}{' '}
                        {deletedActivitiesPreview.length === 1 ? 'activity' : 'activities'}
                      </Text>
                    </View>
                    {deletedActivitiesPreview.map((activity) => (
                      <View
                        key={activity.id}
                        style={[
                          styles.previewActivityItem,
                          { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                        ]}
                      >
                        <View style={[styles.previewActivityColorBar, { backgroundColor: colors.error || '#EF4444' }]} />
                        <View style={styles.previewActivityInfo}>
                          <Text
                            style={[
                              styles.previewActivityName,
                              { color: colors.textPrimary, textDecorationLine: 'line-through' },
                            ]}
                          >
                            {activity.name}
                          </Text>
                          <Text style={[styles.previewActivityMeta, { color: colors.textSecondary }]}>
                            {dayNames[activity.day]} • {activity.startTime} - {activity.endTime}
                            {activity.isRecurring && ' • Recurring'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {generatedActivities.length > 0 && (
                  <View style={styles.previewActivities}>
                    {dayOrder.map((day) => {
                      const dayActivities = generatedActivities.filter((a) => a.day === day);
                      if (dayActivities.length === 0) return null;

                      return (
                        <View key={day} style={styles.previewDayGroup}>
                          <View style={[styles.previewDayHeader, { backgroundColor: colors.inputBackground }]}>
                            <Text style={[styles.previewDayName, { color: colors.textPrimary }]}>
                              {dayNames[day]}
                            </Text>
                            <Text style={[styles.previewDayCount, { color: colors.textSecondary }]}>
                              {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                            </Text>
                          </View>
                          {dayActivities.map((activity, idx) => (
                            <View
                              key={idx}
                              style={[
                                styles.previewActivityItem,
                                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                              ]}
                            >
                              <View style={[styles.previewActivityColorBar, { backgroundColor: activity.color }]} />
                              <View style={styles.previewActivityInfo}>
                                <Text style={[styles.previewActivityName, { color: colors.textPrimary }]}>
                                  {activity.name}
                                </Text>
                                <Text style={[styles.previewActivityMeta, { color: colors.textSecondary }]}>
                                  {activity.startTime} - {activity.endTime}
                                  {activity.isRecurring && ' • Recurring'}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
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
                  backgroundColor: canApprove
                    ? isApproveHovered
                      ? colors.primary + 'DD'
                      : colors.primary
                    : colors.inputBackground,
                  opacity: canApprove ? 1 : 0.7,
                  borderWidth: isApproveHovered && canApprove ? 1 : 0,
                  borderColor: colors.primary,
                },
              ]}
              onPress={handleApprove}
              onHoverIn={() => setIsApproveHovered(true)}
              onHoverOut={() => setIsApproveHovered(false)}
              disabled={!canApprove}
            >
              <Text style={[styles.modalButtonText, { color: canApprove ? '#ffffff' : colors.placeholder }]}>
                Approve & Apply
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
