import { StyleSheet } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

export const settingsStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  destructiveLabel: {
    color: colors.primary,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerBackButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitle: {
    color: colors.foreground,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowChevron: {
    marginLeft: 'auto',
  },
  rowDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginLeft: 54,
  },
  rowIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
  },
  rowLabel: {
    color: colors.foreground,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 2,
  },
  rowTextWrap: {
    flex: 1,
    gap: 0,
  },
  rowTrailingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    gap: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 8,
  },
  footerText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  detailBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    gap: 12,
    padding: 20,
    ...shadows.card,
  },
  detailTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
});
