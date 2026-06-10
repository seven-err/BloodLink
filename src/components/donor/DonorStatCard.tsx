import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

type DonorStatCardProps = {
  icon: ReactNode;
  label: string;
  subtext?: string;
  subtextColor?: string;
  value: string;
};

export function DonorStatCard({
  icon,
  label,
  subtext,
  subtextColor = colors.mutedLight,
  value,
}: DonorStatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtext ? <Text style={[styles.subtext, { color: subtextColor }]}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: '46%',
    padding: 16,
    ...shadows.card,
  },
  iconWrap: {
    marginBottom: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '800',
  },
});
