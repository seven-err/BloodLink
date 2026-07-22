import { StyleSheet } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

export const donorHomeStyles = StyleSheet.create({
  availabilityCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    ...shadows.card,
  },
  availabilityCopy: {
    flex: 1,
    gap: 2,
  },
  availabilityIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  availabilityError: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  availabilityHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  availabilityStatus: {
    color: colors.mutedLight,
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
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    ...shadows.card,
  },
  bloodTypeFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  bloodTypeLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  bloodTypeMeta: {
    color: colors.mutedLight,
    flex: 1,
    fontSize: 14,
  },
  bloodTypeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
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
    paddingBottom: 16,
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeToggleRow: {
    marginTop: 12,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  loadErrorCard: {
    backgroundColor: colors.card,
    borderColor: colors.borderAccent,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  notificationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.card,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 10,
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
    paddingBottom: 110,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  urgentList: {
    gap: 12,
  },
  viewAllButton: {
    paddingVertical: 4,
  },
});
