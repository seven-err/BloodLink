import { ChevronRight, Clock, HeartHandshake, MapPin, MessageCircle, Phone } from 'lucide-react-native';
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
  onCall?: () => void;
  onChat?: () => void;
  onRespond?: () => void;
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
  onCall,
  onChat,
  onRespond,
  onViewDetails,
  subtitle,
  timeLabel,
  title,
  unitsNeeded,
  urgency,
}: DonorRequestFeedCardProps) {
  const handlePrimaryPress = onRespond ?? onViewDetails;

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

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Donate to blood request"
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryButton, pressed ? styles.buttonPressed : null]}
          onPress={handlePrimaryPress}
        >
          <HeartHandshake color={colors.primaryForeground} size={16} strokeWidth={2.25} />
          <Text style={styles.primaryButtonText}>Donate</Text>
        </Pressable>
        {onCall ? (
          <Pressable
            accessibilityLabel="Call hospital"
            accessibilityRole="button"
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}
            onPress={onCall}
          >
            <Phone color="#0F172A" size={16} strokeWidth={2.25} />
          </Pressable>
        ) : null}
        {onChat ? (
          <Pressable
            accessibilityLabel="Chat with requester"
            accessibilityRole="button"
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}
            onPress={onChat}
          >
            <MessageCircle color="#0F172A" size={16} strokeWidth={2.25} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="View request details"
          accessibilityRole="button"
          style={({ pressed }) => [styles.detailsButton, pressed ? styles.buttonPressed : null]}
          onPress={onViewDetails}
        >
          <Text style={styles.detailsText}>Details</Text>
          <ChevronRight color={colors.foreground} size={16} strokeWidth={2.25} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    gap: 12,
    padding: 16,
    ...shadows.card,
  },
  detailsButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  detailsText: {
    color: colors.foreground,
    fontSize: 14,
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
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: 15,
    fontWeight: '700',
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

