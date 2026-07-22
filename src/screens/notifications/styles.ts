import { StyleSheet } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

export const notificationStyles = StyleSheet.create({
  emptyCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: 20,
    ...shadows.card,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  filterTab: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 10,
  },
  filterTabActive: {
    backgroundColor: colors.card,
    ...shadows.card,
  },
  filterTabLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabLabelActive: {
    color: colors.foreground,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerAction: {
    color: colors.info,
    fontSize: 14,
    fontWeight: '700',
  },
  headerActionDisabled: {
    opacity: 0.45,
  },
  headerSide: {
    minWidth: 88,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  listContent: {
    gap: 12,
    padding: 24,
    paddingBottom: 32,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
