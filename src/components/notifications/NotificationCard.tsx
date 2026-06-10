import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';
import type { AppNotification } from '@/services/supabase/notifications';
import { formatRelativeTime } from '@/utils/relativeTime';
import { getNotificationVisual } from '@/utils/notificationDisplay';

type NotificationCardProps = {
  notification: AppNotification;
  onPress: () => void;
};

export function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const visual = getNotificationVisual(notification);
  const isUnread = notification.read_at === null;
  const Icon = visual.Icon;

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        visual.isHighPriority ? styles.cardPriority : styles.cardStandard,
        isUnread && !visual.isHighPriority ? styles.cardUnread : null,
        pressed ? styles.cardPressed : null,
      ]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: visual.iconBackground }]}>
          <Icon color={visual.iconColor} size={18} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.time}>{formatRelativeTime(notification.created_at)}</Text>
          </View>
          <Text style={styles.body}>{notification.body}</Text>
        </View>
      </View>

      {visual.isHighPriority ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>High Priority</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    marginLeft: 52,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    color: colors.mutedLight,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 10,
    padding: 16,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.94,
  },
  cardPriority: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.borderAccent,
  },
  cardStandard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  cardUnread: {
    backgroundColor: colors.backgroundTint,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  time: {
    color: colors.mutedLight,
    fontSize: 12,
    marginLeft: 8,
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
