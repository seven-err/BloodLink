import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { settingsStyles } from '@/screens/profile/settingsStyles';

type SettingsRowProps = {
  destructive?: boolean;
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  showChevron?: boolean;
  showDivider?: boolean;
  subtitle?: string;
  trailing?: ReactNode;
};

export function SettingsRow({
  destructive = false,
  icon,
  label,
  onPress,
  showChevron = true,
  showDivider = false,
  subtitle,
  trailing,
}: SettingsRowProps) {
  const content = (
    <>
      <View style={settingsStyles.rowIcon}>{icon}</View>
      <View style={settingsStyles.rowTextWrap}>
        <Text
          style={[settingsStyles.rowLabel, destructive ? settingsStyles.destructiveLabel : null]}
        >
          {label}
        </Text>
        {subtitle ? <Text style={settingsStyles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing != null || showChevron ? (
        <View style={settingsStyles.rowChevron}>
          {trailing ?? <ChevronRight color={colors.mutedLight} size={20} />}
        </View>
      ) : null}
    </>
  );

  return (
    <>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [settingsStyles.row, pressed ? { opacity: 0.7 } : null]}
          onPress={onPress}
        >
          {content}
        </Pressable>
      ) : (
        <View style={settingsStyles.row}>{content}</View>
      )}
      {showDivider ? <View style={settingsStyles.rowDivider} /> : null}
    </>
  );
}
