import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type ScreenSafeAreaProps = PropsWithChildren<{
  edges?: Edge[];
}>;

export function ScreenSafeArea({ children, edges = ['top'] }: ScreenSafeAreaProps) {
  return (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
