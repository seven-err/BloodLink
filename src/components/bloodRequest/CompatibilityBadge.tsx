import { Check, X } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

type CompatibilityBadgeProps = {
  compatible: boolean;
};

export function CompatibilityBadge({ compatible }: CompatibilityBadgeProps) {
  return (
    <View style={[styles.badge, compatible ? styles.compatible : styles.incompatible]}>
      {compatible ? (
        <Check color={colors.success} size={12} />
      ) : (
        <X color={colors.muted} size={12} />
      )}
      <Text style={[styles.text, compatible ? styles.compatibleText : styles.incompatibleText]}>
        {compatible ? 'Compatible' : 'Not Compatible'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  compatible: {
    backgroundColor: colors.successSoft,
  },
  compatibleText: {
    color: colors.success,
  },
  incompatible: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
  incompatibleText: {
    color: colors.muted,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
