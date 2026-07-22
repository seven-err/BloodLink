import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { UrgencyBadge } from '@/components/bloodRequest/UrgencyBadge';
import { colors, radii, shadows } from '@/constants/theme';
import type { BloodRequestUrgency } from '@/types/database';

type UrgentRequestCardProps = {
  bloodType: string;
  distanceLabel: string;
  onPress: () => void;
  timeLabel: string;
  title: string;
  urgency: BloodRequestUrgency;
};

export function UrgentRequestCard({
  bloodType,
  distanceLabel,
  onPress,
  timeLabel,
  title,
  urgency,
}: UrgentRequestCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <BloodTypeBadge bloodType={bloodType} />
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <UrgencyBadge urgency={urgency} />
          </View>
          <View style={styles.metaRow}>
            <MapPin color={colors.mutedLight} size={14} />
            <Text style={styles.meta}>{distanceLabel}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>{timeLabel}</Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityLabel={`View ${title}`}
        accessibilityRole="button"
        style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
        onPress={onPress}
      >
        <Text style={styles.primaryText}>View request</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.9,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 14,
    padding: 16,
    ...shadows.card,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    color: colors.mutedLight,
    fontSize: 13,
  },
  metaDot: {
    color: colors.mutedLight,
    fontSize: 13,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  primaryText: {
    color: colors.primaryForeground,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
