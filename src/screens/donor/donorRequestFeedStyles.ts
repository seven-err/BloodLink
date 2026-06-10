import { StyleSheet } from 'react-native';

import { colors, radii, shadows } from '@/constants/theme';

export const donorRequestFeedStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 16,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.primaryForeground,
    fontWeight: '700',
  },
  chipRow: {
    gap: 8,
    paddingRight: 24,
  },
  chipScroll: {
    flexGrow: 0,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  createButtonPressed: {
    opacity: 0.92,
  },
  createButtonText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '700',
  },
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
  errorText: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  filterButtonPressed: {
    opacity: 0.9,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mapLinkButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  mapLinkButtonPressed: {
    opacity: 0.9,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '800',
  },
  listContent: {
    gap: 14,
    padding: 24,
    paddingBottom: 32,
  },
  mapTextLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchInput: {
    color: colors.foreground,
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchShell: {
    alignItems: 'center',
    backgroundColor: '#eef2f7',
    borderRadius: radii.pill,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  toolbar: {
    gap: 14,
  },
});
