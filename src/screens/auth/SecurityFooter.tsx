import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { AuthIcon } from './icons';

export function SecurityFooter() {
  return (
    <View style={styles.footer}>
      <AuthIcon name="shield-check" />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Your data is secure with us.</Text>
        <Text style={styles.subtitle}>We never share your information.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    backgroundColor: colors.backgroundTint,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  subtitle: {
    color: colors.mutedLight,
    fontSize: 13,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
});
