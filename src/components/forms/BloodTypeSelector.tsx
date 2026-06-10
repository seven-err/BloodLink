import { Pressable, Text, View } from 'react-native';

import { BLOOD_TYPES } from '@/constants/bloodTypes';
import { createBloodRequestStyles } from '@/screens/recipient/createBloodRequestStyles';
import type { BloodType } from '@/types/database';

type BloodTypeSelectorProps = {
  error?: string;
  label?: string;
  onChange: (bloodType: BloodType) => void;
  value: BloodType | null;
};

export function BloodTypeSelector({
  error,
  label = 'Blood Type Needed',
  onChange,
  value,
}: BloodTypeSelectorProps) {
  return (
    <View style={createBloodRequestStyles.field}>
      <Text style={createBloodRequestStyles.fieldLabel}>{label}</Text>
      <View style={createBloodRequestStyles.bloodTypeGrid}>
        {BLOOD_TYPES.map((bloodType) => {
          const isSelected = value === bloodType;

          return (
            <Pressable
              key={bloodType}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                createBloodRequestStyles.bloodTypeOption,
                isSelected ? createBloodRequestStyles.bloodTypeOptionSelected : null,
              ]}
              onPress={() => onChange(bloodType)}
            >
              <Text
                style={[
                  createBloodRequestStyles.bloodTypeText,
                  isSelected ? createBloodRequestStyles.bloodTypeTextSelected : null,
                ]}
              >
                {bloodType}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={createBloodRequestStyles.errorText}>{error}</Text> : null}
    </View>
  );
}
