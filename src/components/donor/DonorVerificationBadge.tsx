import { CheckCircle2, Clock3, XCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';
import type { DonorVerificationDisplay } from '@/utils/donorVerificationDisplay';

type DonorVerificationBadgeProps = {
  status: DonorVerificationDisplay;
  variant?: 'inline' | 'avatar';
};

const BADGE_CONFIG = {
  pending: {
    Icon: Clock3,
    color: colors.warningText,
    label: 'Pending verification',
  },
  rejected: {
    Icon: XCircle,
    color: colors.primary,
    label: 'Verification rejected',
  },
  verified: {
    Icon: CheckCircle2,
    color: colors.success,
    label: 'Verified donor',
  },
} as const;

export function DonorVerificationBadge({
  status,
  variant = 'inline',
}: DonorVerificationBadgeProps) {
  const config = BADGE_CONFIG[status];
  const Icon = config.Icon;

  if (variant === 'avatar') {
    return (
      <View
        accessibilityLabel={config.label}
        style={[styles.avatarBadge, { backgroundColor: config.color }]}
      >
        <Icon color={colors.primaryForeground} size={12} strokeWidth={2.5} />
      </View>
    );
  }

  return (
    <View accessibilityLabel={config.label} style={styles.inline}>
      <Icon color={config.color} size={18} strokeWidth={2.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBadge: {
    alignItems: 'center',
    borderColor: colors.card,
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 22,
  },
  inline: {
    flexShrink: 0,
  },
});
