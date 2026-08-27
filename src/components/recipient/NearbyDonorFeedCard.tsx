import { ChevronRight, MapPin, MessageCircle, Phone, Send } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { colors, radii, shadows } from '@/constants/theme';

type NearbyDonorFeedCardProps = {
  bloodType: string;
  distanceLabel: string;
  isAvailable: boolean;
  name: string;
  onCall?: () => void;
  onChat?: () => void;
  onDetails: () => void;
  onRequest: () => void;
  timeLabel: string;
};

export function NearbyDonorFeedCard({
  bloodType,
  distanceLabel,
  isAvailable,
  name,
  onCall,
  onChat,
  onDetails,
  onRequest,
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
          accessibilityLabel={`Request blood from ${name}`}
          accessibilityRole="button"
          style={({ pressed }) => [styles.requestButton, pressed ? styles.buttonPressed : null]}
          onPress={onRequest}
        >
          <Send color={colors.primaryForeground} size={15} strokeWidth={2.25} />
          <Text style={styles.requestText}>Request Blood</Text>
        </Pressable>
        {onCall ? (
          <Pressable
            accessibilityLabel={`Call ${name}`}
            accessibilityRole="button"
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}
            onPress={onCall}
          >
            <Phone color="#0F172A" size={16} strokeWidth={2.25} />
          </Pressable>
        ) : null}
        {onChat ? (
          <Pressable
            accessibilityLabel={`Chat with ${name}`}
            accessibilityRole="button"
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}
            onPress={onChat}
          >
            <MessageCircle color="#0F172A" size={16} strokeWidth={2.25} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="View donor details"
          accessibilityRole="button"
          style={({ pressed }) => [styles.detailsButton, pressed ? styles.buttonPressed : null]}
          onPress={onDetails}
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
  requestButton: {
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
  requestText: {
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

