import { StyleSheet } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

export const nearbyDonorDetailStyles = StyleSheet.create({
  avatarShell: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 16,
    padding: 20,
    ...shadows.card,
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  lastDonation: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  name: {
    color: colors.foreground,
    flexShrink: 1,
    fontSize: 24,
    fontWeight: '800',
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  noticeCard: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  noticeText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  noticeTitle: {
    color: colors.infoText,
    fontSize: 15,
    fontWeight: '800',
  },
  actionHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    padding: 24,
    paddingBottom: 32,
  },
  statCopy: {
    flex: 1,
    gap: 2,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  statRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  statValue: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '800',
  },
  statsCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 16,
    padding: 20,
    ...shadows.card,
  },
  statusPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillAvailable: {
    backgroundColor: colors.successSoft,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusPillTextAvailable: {
    color: colors.success,
  },
  statusPillTextUnavailable: {
    color: colors.muted,
  },
  statusPillUnavailable: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
