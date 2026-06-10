import { StyleSheet } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

export const homeStyles = StyleSheet.create({
  actionCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 4,
    minWidth: '46%',
    padding: 16,
    ...shadows.card,
  },
  actionCardPressed: {
    opacity: 0.9,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionIcon: {
    color: colors.primary,
    fontSize: 20,
    lineHeight: 24,
  },
  actionLabel: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  actionPressable: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: '46%',
  },
  actions: {
    gap: 12,
  },
  availabilityCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    gap: 12,
    padding: 16,
    ...shadows.card,
  },
  availabilityDot: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  availabilityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  availabilityStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  availabilityTitle: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  bloodTypeCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    gap: 12,
    padding: 16,
    ...shadows.card,
  },
  bloodTypeHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  bloodTypeLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  bloodTypeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  emergencyCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.cardLg,
    gap: 14,
    padding: 20,
    ...shadows.card,
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  emergencyTitle: {
    color: colors.primaryForeground,
    fontSize: 20,
    fontWeight: '800',
  },
  greeting: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '800',
  },
  header: {
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: 4,
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  roleLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    padding: 24,
    paddingBottom: 40,
  },
  sectionEyebrow: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    gap: 4,
  },
  sectionSubtitle: {
    color: colors.mutedLight,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
});
