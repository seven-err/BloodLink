import { Pressable, Text, View } from 'react-native';

import {
  FORM_URGENCY_OPTIONS,
  type FormUrgencyLevel,
} from '@/constants/createBloodRequestForm';
import { createBloodRequestStyles } from '@/screens/recipient/createBloodRequestStyles';

type FormUrgencySelectorProps = {
  error?: string;
  onChange: (level: FormUrgencyLevel) => void;
  value: FormUrgencyLevel;
};

const SELECTED_STYLES: Record<
  FormUrgencyLevel,
  { option: object; text: object }
> = {
  critical: {
    option: createBloodRequestStyles.urgencyOptionCriticalSelected,
    text: createBloodRequestStyles.urgencyTextCriticalSelected,
  },
  high: {
    option: createBloodRequestStyles.urgencyOptionHighSelected,
    text: createBloodRequestStyles.urgencyTextHighSelected,
  },
  low: {
    option: createBloodRequestStyles.urgencyOptionLowSelected,
    text: createBloodRequestStyles.urgencyTextLowSelected,
  },
  medium: {
    option: createBloodRequestStyles.urgencyOptionMediumSelected,
    text: createBloodRequestStyles.urgencyTextMediumSelected,
  },
};

export function FormUrgencySelector({ error, onChange, value }: FormUrgencySelectorProps) {
  return (
    <View style={createBloodRequestStyles.field}>
      <Text style={createBloodRequestStyles.fieldLabel}>Urgency Level</Text>
      <View style={createBloodRequestStyles.urgencyGrid}>
        {FORM_URGENCY_OPTIONS.map((option) => {
          const isSelected = value === option.id;
          const selectedStyles = SELECTED_STYLES[option.id];

          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                createBloodRequestStyles.urgencyOption,
                isSelected ? selectedStyles.option : null,
              ]}
              onPress={() => onChange(option.id)}
            >
              <Text
                style={[
                  createBloodRequestStyles.urgencyText,
                  isSelected ? selectedStyles.text : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={createBloodRequestStyles.errorText}>{error}</Text> : null}
    </View>
  );
}
