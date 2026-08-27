import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { UrgencyBadge } from '@/components/bloodRequest/UrgencyBadge';
import { StatusBadge } from '@/components/bloodRequest/StatusBadge';
import { colors, radii, shadows } from '@/constants/theme';
import type { BloodRequestUrgency } from '@/types/database';

type RequestListCardProps = {
  bloodType: string;
  metaLines: string[];
  onPress: () => void;
  status?: string;
  subtitle?: string;
  title?: string;
  trailing?: ReactNode;
  unitsNeeded: number;
  urgency?: BloodRequestUrgency;
};

export function RequestListCard({
  bloodType,
  metaLines,
  onPress,
  status,
  subtitle,
  title,
  trailing,
  unitsNeeded,
  urgency,
}: RequestListCardProps) {
  const displayTitle =
    title ??
    `${bloodType} · ${unitsNeeded} unit${unitsNeeded === 1 ? '' : 's'}`;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>{displayTitle}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {trailing}
      </View>

      <View style={styles.badgeRow}>
        <BloodTypeBadge bloodType={bloodType} />
        {urgency ? <UrgencyBadge urgency={urgency} /> : null}
        {status ? <StatusBadge status={status} /> : null}
      </View>

      <View style={styles.metaBlock}>
        {metaLines.map((line) => (
          <Text key={line} style={styles.meta}>
            {line}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    gap: 10,
    padding: 16,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.92,
  },
  headerMain: {
    flex: 1,
    gap: 2,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.mutedLight,
    fontSize: 14,
    lineHeight: 20,
  },
  metaBlock: {
    gap: 2,
  },
  subtitle: {
    color: colors.mutedLight,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '700',
  },
});
