import { Map, Satellite } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';
import type { MapViewMode } from '@/constants/mapTiles';

type MapStyleToggleProps = {
  mapMode: MapViewMode;
  onToggle: () => void;
};

export function MapStyleToggle({ mapMode, onToggle }: MapStyleToggleProps) {
  const isSatellite = mapMode === 'satellite';
  const Icon = isSatellite ? Map : Satellite;
  const label = isSatellite ? 'Map' : 'Satellite';

  return (
    <Pressable
      accessibilityLabel={isSatellite ? 'Switch to street map' : 'Switch to satellite map'}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
      onPress={onToggle}
    >
      <Icon color={colors.foreground} size={16} strokeWidth={2.25} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...shadows.card,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  label: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
});
