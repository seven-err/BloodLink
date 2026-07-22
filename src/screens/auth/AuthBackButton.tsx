import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/theme';

type AuthBackButtonProps = {
  onPress: () => void;
};

export function AuthBackButton({ onPress }: AuthBackButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={8}
      style={styles.button}
      onPress={onPress}
    >
      <ChevronLeft color={colors.muted} size={22} strokeWidth={2} />
      <Text style={styles.label}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '500',
  },
});
