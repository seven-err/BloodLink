import { StyleSheet } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

export const recipientStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.cardLg,
    gap: 10,
    padding: 20,
    ...shadows.card,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  donorName: {
    color: colors.foreground,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  donorTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: 0,
  },
  centerContent: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  detailGrid: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 14,
    paddingTop: 14,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.foreground,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 8,
    padding: 20,
    ...shadows.card,
  },
  emptyText: {
    color: colors.mutedLight,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoBanner: {
    backgroundColor: colors.infoSoft,
    borderColor: '#bfdbfe',
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  infoBannerText: {
    color: colors.infoText,
    fontSize: 14,
    lineHeight: 20,
  },
  listCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 8,
    padding: 16,
    ...shadows.card,
  },
  listContent: {
    gap: 12,
    padding: 24,
    paddingBottom: 40,
  },
  meta: {
    color: colors.mutedLight,
    fontSize: 14,
    lineHeight: 20,
  },
  optionGroup: {
    gap: 8,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: '#374151',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  pillTextSelected: {
    color: colors.primaryForeground,
  },
  requestTitle: {
    color: colors.foreground,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 12,
    padding: 24,
    paddingBottom: 40,
  },
  sectionIntro: {
    gap: 6,
  },
  subtitle: {
    color: colors.mutedLight,
    fontSize: 16,
    lineHeight: 24,
  },
  successText: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  title: {
    color: colors.foreground,
    fontSize: 24,
    fontWeight: '800',
  },
  urgencyPillCritical: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  urgencyPillNormal: {
    backgroundColor: colors.infoSoft,
    borderColor: '#93c5fd',
  },
  urgencyPillTextCritical: {
    color: colors.primaryForeground,
  },
  urgencyPillTextNormal: {
    color: colors.infoText,
  },
  urgencyPillTextUrgent: {
    color: colors.orangeText,
  },
  urgencyPillUrgent: {
    backgroundColor: colors.orangeSoft,
    borderColor: '#fdba74',
  },
});
