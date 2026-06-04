import type { PressableProps } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function PrimaryButton({
  title,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={[
        styles.button,
        variant === 'secondary' ? styles.secondary : styles.primary,
        isDisabled ? styles.disabled : null,
        typeof style === 'function' ? undefined : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#b91c1c' : '#fff'} />
      ) : (
        <Text
          style={[
            styles.title,
            variant === 'secondary' ? styles.secondaryTitle : styles.primaryTitle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  disabled: {
    opacity: 0.65,
  },
  primary: {
    backgroundColor: '#e50914',
  },
  primaryTitle: {
    color: '#fff',
  },
  secondary: {
    backgroundColor: '#fee2e2',
  },
  secondaryTitle: {
    color: '#b91c1c',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
