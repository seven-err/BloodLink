import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { UrgencyBadge } from '@/components/bloodRequest/UrgencyBadge';
import { colors, radii, shadows } from '@/constants/theme';
import type { BloodRequestUrgency } from '@/types/database';

type UrgentRequestCardProps = {
  bloodType: string;
  distanceLabel: string;
  onDetails: () => void;
  onRespond: () => void;
  timeLabel: string;
  title: string;
  urgency: BloodRequestUrgency;
};

export function UrgentRequestCard({
  bloodType,
  distanceLabel,
  onDetails,
  onRespond,
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

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.respondButton, pressed ? styles.buttonPressed : null]}
          onPress={onRespond}
        >
          <Text style={styles.respondText}>Respond</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.detailsButton, pressed ? styles.buttonPressed : null]}
          onPress={onDetails}
        >
          <Text style={styles.detailsText}>Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
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
  respondButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  respondText: {
    color: colors.primaryForeground,
    fontSize: 15,
    fontWeight: '700',
  },
  detailsButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  detailsText: {
    color: colors.foreground,
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
