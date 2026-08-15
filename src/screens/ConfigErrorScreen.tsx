import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii } from '@/constants/theme';
import { missingRequiredEnv } from '@/config/env';

export function ConfigErrorScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>App configuration missing</Text>
        <Text style={styles.body}>
          This build was packaged without required environment variables. Rebuild with EAS env
          vars set for this profile.
        </Text>
        <Text style={styles.detail} selectable>
          Missing: {missingRequiredEnv.join(', ')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  title: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  detail: {
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 18,
  },
});
