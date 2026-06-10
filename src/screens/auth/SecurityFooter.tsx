import { StyleSheet, Text, View } from 'react-native';
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
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  title: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '600',
  },
});
