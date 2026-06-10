import { Pressable, StyleSheet, Text } from 'react-native';

type SocialButtonProps = {
  icon: React.ReactNode;
  title: string;
  onPress?: () => void;
};

export function SocialButton({ icon, title, onPress }: SocialButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      {icon}
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
  },
  title: {
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '600',
  },
});
