import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, Text, View } from 'react-native';

import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import type { AppStackParamList } from '@/navigation/types';
import { settingsStyles } from './settingsStyles';

type Props = NativeStackScreenProps<AppStackParamList, 'SettingsDetail'>;

export function SettingsDetailScreen({ navigation, route }: Props) {
  const { description, title } = route.params;

  return (
    <View style={settingsStyles.screen}>
      <SettingsScreenHeader title={title} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={settingsStyles.scrollContent}>
        <View style={settingsStyles.detailCard}>
          <Text style={settingsStyles.detailTitle}>{title}</Text>
          <Text style={settingsStyles.detailBody}>{description}</Text>
        </View>
      </ScrollView>
    </View>
  );
}
