import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

type SocialButtonProps = {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
};

export function SocialButton({ icon, title, onPress }: SocialButtonProps) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
      onPress={onPress}
    >
      {icon}
      <Text style={styles.title}>{title}</Text>
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
  buttonPressed: {
    opacity: 0.92,
  },
  title: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
});
