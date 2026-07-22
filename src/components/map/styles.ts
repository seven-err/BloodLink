import { StyleSheet } from 'react-native';

import { colors, radii } from '@/constants/theme';

export const mapStyles = StyleSheet.create({
  attributionBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    bottom: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  attributionText: {
    color: colors.mutedLight,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  mapContainer: {
    borderColor: colors.borderAccent,
    borderRadius: radii.card,
    borderWidth: 1,
    minHeight: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  styleToggle: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 3,
  },
});
