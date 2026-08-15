import { StyleSheet, Text, View } from 'react-native';

import { HemieAvatar } from '@/components/hemie/HemieAvatar';
import { colors, radii } from '@/constants/theme';

type HemieMessageBubbleProps = {
  isUser?: boolean;
  text: string;
};

export function HemieMessageBubble({ isUser = false, text }: HemieMessageBubbleProps) {
  if (isUser) {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <HemieAvatar size={36} />
      <View style={styles.assistantBubble}>
        <Text style={styles.assistantText}>{text}</Text>
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
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radii.card,
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
});
