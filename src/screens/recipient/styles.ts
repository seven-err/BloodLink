import { StyleSheet } from 'react-native';

export const recipientStyles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    gap: 10,
    padding: 20,
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 24,
  },
  emptyText: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  eyebrow: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  listCard: {
    backgroundColor: '#fff',
    borderColor: '#fecaca',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  listContent: {
    gap: 12,
    padding: 24,
    paddingBottom: 40,
  },
  meta: {
    color: '#6b7280',
    fontSize: 14,
  },
  optionGroup: {
    gap: 8,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillSelected: {
    backgroundColor: '#b91c1c',
  },
  pillText: {
    color: '#374151',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  pillTextSelected: {
    color: '#fff',
  },
  requestTitle: {
    color: '#991b1b',
    fontSize: 18,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: '#fef2f2',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: '#991b1b',
    fontSize: 28,
    fontWeight: '800',
  },
});
