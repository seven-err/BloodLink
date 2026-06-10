import { Clock, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { CompatibilityBadge } from '@/components/bloodRequest/CompatibilityBadge';
import { UrgencyBadge } from '@/components/bloodRequest/UrgencyBadge';
import { colors, radii, shadows } from '@/constants/theme';
import type { BloodRequestUrgency } from '@/types/database';

type DonorRequestFeedCardProps = {
  bloodType: string;
  compatible: boolean;
  distanceLabel: string;
  onViewDetails: () => void;
  subtitle: string;
  timeLabel: string;
  title: string;
  unitsNeeded: number;
  urgency: BloodRequestUrgency;
};

const URGENCY_FEED_LABELS: Partial<Record<BloodRequestUrgency, string>> = {
  urgent: 'High',
};

export function DonorRequestFeedCard({
  bloodType,
  compatible,
  distanceLabel,
  onViewDetails,
  subtitle,
  timeLabel,
  title,
  unitsNeeded,
  urgency,
}: DonorRequestFeedCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <UrgencyBadge
          label={URGENCY_FEED_LABELS[urgency]}
          showIcon
          urgency={urgency}
          variant="pill"
        />
      </View>

      <View style={styles.badgeRow}>
        <BloodTypeBadge bloodType={bloodType} variant="solid" />
        <CompatibilityBadge compatible={compatible} />
      </View>

      <View style={styles.metaRow}>
        <MapPin color={colors.mutedLight} size={14} />
        <Text style={styles.meta}>{distanceLabel}</Text>
        <Clock color={colors.mutedLight} size={14} />
        <Text style={styles.meta}>{timeLabel}</Text>
      </View>

      <Text style={styles.units}>
        {unitsNeeded} unit{unitsNeeded === 1 ? '' : 's'} needed
      </Text>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.detailsButton, pressed ? styles.buttonPressed : null]}
        onPress={onViewDetails}
      >
        <Text style={styles.detailsText}>View Details</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    ...shadows.card,
  },
  detailsButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  detailsText: {
    color: colors.primaryForeground,
    fontSize: 15,
    fontWeight: '700',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    color: colors.mutedLight,
    fontSize: 13,
    fontWeight: '500',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  subtitle: {
    color: colors.mutedLight,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  units: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
});
