import { Droplet, HeartHandshake } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useUserMode, type UserMode } from '@/context/UserModeContext';
import { colors, radii, shadows } from '@/constants/theme';

type ModeOption = {
  icon: typeof Droplet;
  label: string;
  mode: UserMode;
};

const MODE_OPTIONS: ModeOption[] = [
  { icon: Droplet, label: 'Donate', mode: 'donate' },
  { icon: HeartHandshake, label: 'Request', mode: 'request' },
];

type ModeToggleProps = {
  showHint?: boolean;
};

export function ModeToggle({ showHint = false }: ModeToggleProps) {
  const { mode, setMode } = useUserMode();

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel="Switch between donate and request mode"
        accessibilityRole="tablist"
        style={styles.container}
      >
        {MODE_OPTIONS.map(({ icon: Icon, label, mode: optionMode }) => {
          const selected = mode === optionMode;

          return (
            <Pressable
              key={optionMode}
              accessibilityLabel={`${label} mode`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.segment,
                selected ? styles.segmentSelected : null,
                pressed ? styles.segmentPressed : null,
              ]}
              onPress={() => setMode(optionMode)}
            >
              <Icon
                color={selected ? colors.primary : colors.muted}
                size={15}
                strokeWidth={2.25}
              />
              <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {showHint ? (
        <Text style={styles.hint}>
          {mode === 'donate'
            ? 'Donate mode shows nearby blood requests you can help with.'
            : 'Request mode lets you create requests and find compatible donors.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  segment: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentPressed: {
    opacity: 0.9,
  },
  segmentSelected: {
    backgroundColor: colors.card,
    ...shadows.card,
  },
  wrap: {
    width: '100%',
  },
});
