import { StyleSheet, Text } from 'react-native';

type AuthIconName =
  | 'apple'
  | 'check'
  | 'email'
  | 'google'
  | 'lock'
  | 'phone'
  | 'unlock'
  | 'user';

const glyphs: Record<AuthIconName, string> = {
  apple: '',
  check: '✓',
  email: '✉',
  google: 'G',
  lock: '🔒',
  phone: '☎',
  unlock: '🔓',
  user: '👤',
};

type IconProps = {
  name: AuthIconName;
};

export const AuthIcon = ({ name }: IconProps) => (
  <Text style={styles.auth}>{glyphs[name]}</Text>
);

export const MutedIcon = ({ name }: IconProps) => (
  <Text style={styles.muted}>{glyphs[name]}</Text>
);

const styles = StyleSheet.create({
  auth: {
    color: '#e50914',
    fontSize: 22,
  },
  muted: {
    color: '#7d7f8c',
    fontSize: 21,
  },
});
