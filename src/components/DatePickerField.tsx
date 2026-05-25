import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/store/useThemeStore';
import { formatDateToISO } from '@/types/schedule';

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
};

const formatLocal = (date: Date | null) => (date ? formatDateToISO(date) : '');

/**
 * Cross-platform date picker:
 * - Web: native HTML <input type="date">.
 * - iOS/Android: @react-native-community/datetimepicker via a modal.
 */
export const DatePickerField = ({ value, onChange, placeholder = 'Select date', minDate }: Props) => {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === 'web') {
    const WebInput: any = 'input';
    return (
      <View style={styles.row}>
        <View
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <WebInput
            type="date"
            value={formatLocal(value)}
            min={minDate ? formatLocal(minDate) : undefined}
            onChange={(e: any) => {
              const v = e?.target?.value;
              if (!v) {
                onChange(null);
                return;
              }
              const [year, month, day] = v.split('-').map(Number);
              onChange(new Date(year, month - 1, day));
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: colors.textPrimary,
              fontSize: 14,
              padding: 0,
              minWidth: 0,
            }}
          />
          <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        </View>
      </View>
    );
  }

  // Lazy require avoids loading the native module on web
  let DateTimePicker: any = null;
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch {
    DateTimePicker = null;
  }

  return (
    <View>
      <Pressable
        style={[
          styles.input,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text
          style={[
            styles.text,
            { color: value ? colors.textPrimary : colors.placeholder },
          ]}
        >
          {value ? formatLocal(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </Pressable>

      {showPicker && DateTimePicker && (
        <DateTimePicker
          value={value ?? minDate ?? new Date()}
          mode="date"
          minimumDate={minDate}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_event: any, selected?: Date) => {
            if (Platform.OS === 'android') {
              setShowPicker(false);
            }
            if (selected) {
              onChange(selected);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
  },
  text: { fontSize: 14 },
});
