import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { colors, radii, shadows } from '@/constants/theme';

type NearbyDonorFeedCardProps = {
  bloodType: string;
  distanceLabel: string;
  isAvailable: boolean;
  name: string;
  onDetails: () => void;
  onRespond: () => void;
  timeLabel: string;
};

export function NearbyDonorFeedCard({
  bloodType,
  distanceLabel,
  isAvailable,
  name,
  onDetails,
  onRespond,
  timeLabel,
}: NearbyDonorFeedCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <BloodTypeBadge bloodType={bloodType} />
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{name}</Text>
            <View
              style={[
                styles.statusBadge,
                isAvailable ? styles.statusBadgeAvailable : styles.statusBadgeUnavailable,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isAvailable ? styles.statusTextAvailable : styles.statusTextUnavailable,
                ]}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
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
  statusBadge: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeAvailable: {
    backgroundColor: colors.successSoft,
  },
  statusBadgeUnavailable: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextAvailable: {
    color: colors.success,
  },
  statusTextUnavailable: {
    color: colors.muted,
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
