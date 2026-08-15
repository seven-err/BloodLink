import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

type SocialButtonProps = {
  disabled?: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  title: string;
  onPress?: () => void;
};

export function SocialButton({ disabled, icon, loading, title, onPress }: SocialButtonProps) {
  const label = loading
    ? `Connecting to ${title.replace(/^Continue with /i, '')}…`
    : title;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: Boolean(loading), disabled: Boolean(disabled || loading) }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && !loading ? styles.buttonPressed : null,
        disabled || loading ? styles.buttonDisabled : null,
      ]}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.title}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  title: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
});
