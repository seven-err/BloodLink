import { Pressable, StyleSheet, Text } from 'react-native';

type SocialButtonProps = {
  icon: React.ReactNode;
  title: string;
};

export function SocialButton({ icon, title }: SocialButtonProps) {
  return (
    <Pressable style={styles.button}>
      {icon}
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#d7d7d7',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'center',
    minHeight: 64,
    width: '100%',
  },
  title: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },
});
