import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    elevation: 2,
    gap: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  container: {
    backgroundColor: '#fafafa',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
  },
  helper: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: '#202124',
    fontSize: 28,
    fontWeight: '800',
  },
});
