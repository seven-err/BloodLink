import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

type SafetyReminderCardProps = {
  message?: string;
  title?: string;
};

export function SafetyReminderCard({
  message = 'Always verify donor identity and ensure blood donation happens at certified medical facilities.',
  title = 'Safety reminder',
}: SafetyReminderCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  message: {
    color: colors.warningText,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.warningText,
    fontSize: 15,
    fontWeight: '700',
  },
});
