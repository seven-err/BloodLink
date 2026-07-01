import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { settingsStyles } from '@/screens/profile/settingsStyles';

type SettingsSectionProps = {
  children: ReactNode;
  title: string;
};

export function SettingsSection({ children, title }: SettingsSectionProps) {
  return (
    <View style={settingsStyles.section}>
      <Text style={settingsStyles.sectionTitle}>{title}</Text>
      <View style={settingsStyles.card}>{children}</View>
    </View>
  );
}
