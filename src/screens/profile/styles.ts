import { StyleSheet } from 'react-native';

export const profileStyles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  availabilityCard: {
    backgroundColor: '#fff',
    borderColor: '#fecaca',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  availabilityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    gap: 14,
    padding: 20,
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailRow: {
    gap: 4,
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
  helper: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    gap: 16,
    padding: 24,
    paddingBottom: 40,
  },
  screen: {
    backgroundColor: '#fef2f2',
    flex: 1,
  },
  sectionTitle: {
    color: '#991b1b',
    fontSize: 18,
    fontWeight: '800',
  },
  settingsRow: {
    backgroundColor: '#fff',
    borderColor: '#fecaca',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 16,
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
  verificationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verificationBadgeText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '700',
  },
});
