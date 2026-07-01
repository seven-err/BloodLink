import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

type AuthBackButtonProps = {
  onPress: () => void;
};

export function AuthBackButton({ onPress }: AuthBackButtonProps) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress} style={styles.button}>
      <ChevronLeft color="#4b5563" size={22} strokeWidth={2} />
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
    color: '#4b5563',
    fontSize: 16,
    fontWeight: '500',
  },
});
