import type { ReactNode } from 'react';
import type { TextInputProps } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type FormTextInputProps = TextInputProps & {
  label: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onRightIconPress?: () => void;
};

export function FormTextInput({
  label,
  error,
  leftIcon,
  onRightIconPress,
  rightIcon,
  style,
  ...props
}: FormTextInputProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, error ? styles.inputError : null]}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor="#7d7f8c"
          style={[styles.input, style]}
          {...props}
        />
        {rightIcon ? (
          <Pressable
            disabled={!onRightIconPress}
            style={styles.icon}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
  },
  icon: {
    alignItems: 'center',
    minWidth: 28,
  },
  input: {
    color: '#1f2937',
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 66,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
});
