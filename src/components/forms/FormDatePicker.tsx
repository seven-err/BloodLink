import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { RequestFormField } from '@/components/forms/RequestFormField';
import { colors } from '@/constants/theme';
import { createBloodRequestStyles } from '@/screens/recipient/createBloodRequestStyles';
import {
  formatBirthdateDisplay,
  formatBirthdateIso,
  parseBirthdateIso,
} from '@/utils/birthdate';

type FormDatePickerProps = {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

const maximumDate = new Date();
const minimumDate = new Date(1920, 0, 1);

export function FormDatePicker({ error, label, onChange, value }: FormDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = parseBirthdateIso(value) ?? new Date(2000, 0, 1);
  const displayValue = formatBirthdateDisplay(value);

  if (Platform.OS === 'web') {
    return (
      <RequestFormField
        error={error}
        keyboardType="numbers-and-punctuation"
        label={label}
        placeholder="YYYY-MM-DD"
        value={value}
        onChangeText={onChange}
      />
    );
  }

  const handleChange = (_event: unknown, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (!date) {
      return;
    }

    onChange(formatBirthdateIso(date));
  };

  return (
    <View style={createBloodRequestStyles.field}>
      <Text style={createBloodRequestStyles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        style={[
          createBloodRequestStyles.inputShell,
          { alignItems: 'center', minHeight: 48, paddingVertical: 12 },
          error ? createBloodRequestStyles.inputShellError : null,
        ]}
        onPress={() => setShowPicker((current) => !current)}
      >
        <Calendar color={colors.mutedLight} size={18} />
        <Text
          style={[
            createBloodRequestStyles.input,
            !displayValue ? { color: colors.mutedLight } : null,
          ]}
        >
          {displayValue || 'Select birthdate'}
        </Text>
      </Pressable>

      {showPicker ? (
        <View>
          <DateTimePicker
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            mode="date"
            value={selectedDate}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' ? (
            <Pressable
              accessibilityRole="button"
              style={{ alignSelf: 'flex-end', paddingVertical: 8 }}
              onPress={() => setShowPicker(false)}
            >
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={createBloodRequestStyles.errorText}>{error}</Text> : null}
    </View>
  );
}
