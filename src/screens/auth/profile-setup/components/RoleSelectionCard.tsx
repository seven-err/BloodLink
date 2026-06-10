import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type RoleSelectionCardProps = {
  description: string;
  icon: ReactNode;
  iconBackground?: string;
  onPress: () => void;
  selected: boolean;
  title: string;
};

export function RoleSelectionCard({
  description,
  icon,
  iconBackground = '#fee2e2',
  onPress,
  selected,
  title,
}: RoleSelectionCardProps) {
  return (
    <Pressable
      style={[styles.card, selected ? styles.cardSelected : null]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>{icon}</View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 16,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  description: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});
