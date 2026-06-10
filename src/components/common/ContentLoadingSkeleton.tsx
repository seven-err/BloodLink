import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/common/Skeleton';
import { colors } from '@/constants/theme';

type ContentLoadingSkeletonProps = {
  rows?: number;
};

export function ContentLoadingSkeleton({ rows = 3 }: ContentLoadingSkeletonProps) {
  return (
    <View style={styles.screen}>
      <Skeleton borderRadius={16} height={96} width="100%" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} borderRadius={16} height={140} width="100%" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: 16,
    padding: 24,
  },
});
