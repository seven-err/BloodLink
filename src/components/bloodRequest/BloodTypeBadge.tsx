import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamilies } from '@/constants/theme';
import type { BloodType } from '@/types/database';

type BloodTypeBadgeProps = {
  bloodType: BloodType | string;
  size?: 'md' | 'lg';
  variant?: 'soft' | 'solid';
};

export function BloodTypeBadge({
  bloodType,
  size = 'md',
  variant = 'soft',
}: BloodTypeBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        size === 'lg' ? styles.badgeLg : null,
        variant === 'solid' ? styles.badgeSolid : null,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'lg' ? styles.textLg : null,
          variant === 'solid' ? styles.textSolid : null,
        ]}
      >
        {bloodType}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  badgeLg: {
    borderRadius: 14,
    minHeight: 56,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeSolid: {
    backgroundColor: colors.primary,
  },
  text: {
    color: '#0F172A',
    fontFamily: fontFamilies.displayHeavy,
    fontSize: 16,
    fontWeight: '800',
  },
  textLg: {
    fontSize: 20,
  },
  textSolid: {
    color: colors.primaryForeground,
  },
});
