import { StyleSheet, Text, View } from 'react-native';

import { HemieAvatar } from '@/components/hemie/HemieAvatar';
import { colors, radii } from '@/constants/theme';

type HemieMessageBubbleProps = {
  isUser?: boolean;
  text: string;
  timestamp: string;
};

export function HemieMessageBubble({ isUser = false, text, timestamp }: HemieMessageBubbleProps) {
  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{text}</Text>
          <Text style={styles.userTimestamp}>{timestamp}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <HemieAvatar size={36} />
      <View style={styles.assistantBubble}>
        <Text style={styles.assistantText}>{text}</Text>
        <Text style={styles.assistantTimestamp}>{timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  assistantText: {
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 22,
  },
  assistantTimestamp: {
    color: colors.mutedLight,
    fontSize: 12,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radii.card,
    gap: 6,
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  userText: {
    color: colors.primaryForeground,
    fontSize: 15,
    lineHeight: 22,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'right',
  },
});
