import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

import { colors } from '@/constants/theme';
import { createBloodRequestStyles } from '@/screens/recipient/createBloodRequestStyles';

type RequestFormFieldProps = TextInputProps & {
  error?: string;
  label: string;
  leftIcon?: ReactNode;
  multiline?: boolean;
};

export function RequestFormField({
  error,
  label,
  leftIcon,
  multiline = false,
  style,
  ...props
}: RequestFormFieldProps) {
  return (
    <View style={createBloodRequestStyles.field}>
      <Text style={createBloodRequestStyles.fieldLabel}>{label}</Text>
      <View
        style={[
          createBloodRequestStyles.inputShell,
          leftIcon ? createBloodRequestStyles.inputShellWithIcon : null,
          error ? createBloodRequestStyles.inputShellError : null,
        ]}
      >
        {leftIcon}
        <TextInput
          multiline={multiline}
          placeholderTextColor={colors.mutedLight}
          style={[
            createBloodRequestStyles.input,
            multiline ? createBloodRequestStyles.inputMultiline : null,
            style,
          ]}
          {...props}
        />
      </View>
      {error ? <Text style={createBloodRequestStyles.errorText}>{error}</Text> : null}
    </View>
  );
}
