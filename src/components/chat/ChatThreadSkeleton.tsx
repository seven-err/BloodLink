import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/common/Skeleton';
import { colors } from '@/constants/theme';

export function ChatThreadSkeleton() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Skeleton borderRadius={8} height={22} width={22} />
        <Skeleton borderRadius={24} height={48} width={48} />
        <View style={styles.headerCopy}>
          <Skeleton borderRadius={8} height={18} width="55%" />
          <Skeleton borderRadius={8} height={14} width="40%" />
        </View>
      </View>
      <View style={styles.messages}>
        <Skeleton borderRadius={16} height={88} width="100%" />
        <Skeleton borderRadius={16} height={72} width="78%" />
        <Skeleton borderRadius={16} height={56} style={styles.userBubble} width="65%" />
      </View>
      <View style={styles.composer}>
        <Skeleton borderRadius={12} height={48} style={styles.input} />
        <Skeleton borderRadius={12} height={48} width={48} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    alignItems: 'flex-end',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  input: {
    flex: 1,
  },
  messages: {
    gap: 12,
    padding: 20,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
});
