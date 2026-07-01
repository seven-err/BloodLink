import { ArrowLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { settingsStyles } from '@/screens/profile/settingsStyles';

type SettingsScreenHeaderProps = {
  onBack: () => void;
  title: string;
};

export function SettingsScreenHeader({ onBack, title }: SettingsScreenHeaderProps) {
  const { top: topInset } = useSafeAreaInsets();

  return (
    <View style={[settingsStyles.header, { paddingTop: topInset + 8 }]}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={8}
        style={settingsStyles.headerBackButton}
        onPress={onBack}
      >
        <ArrowLeft color={colors.foreground} size={22} />
      </Pressable>
      <Text style={settingsStyles.headerTitle}>{title}</Text>
    </View>
  );
}
