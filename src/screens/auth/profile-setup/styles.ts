import { StyleSheet } from 'react-native';

import { colors, radii } from '@/constants/theme';

export const profileSetupStyles = StyleSheet.create({
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  bloodTypeButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    width: '22%',
    paddingVertical: 14,
  },
  bloodTypeButtonSelected: {
    borderColor: '#f87171', // Soft red from mockup
  },
  bloodTypeText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  bloodTypeTextSelected: {
    color: '#f87171',
  },
  callout: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  calloutTitle: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '700',
  },
  calloutItem: {
    color: '#1e3a8a',
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#ffffff',
  },
  documentChip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  documentChipText: {
    color: colors.primaryDark,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  documentList: {
    gap: 8,
  },
  heading: {
    gap: 8,
  },
  infoCallout: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  infoCalloutText: {
    color: '#854d0e',
    fontSize: 14,
    lineHeight: 20,
  },
  infoCalloutTitle: {
    color: '#854d0e',
    fontSize: 16,
    fontWeight: '700',
  },
  photoCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    height: 96,
    justifyContent: 'center',
    width: 96,
    marginBottom: 8,
  },
  progressTrack: {
    backgroundColor: '#e5e7eb',
    height: 3,
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  progressSegment: {
    backgroundColor: colors.primary,
    height: '100%',
  },
  readOnlyField: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  readOnlyLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  readOnlyValue: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  roleList: {
    gap: 12,
  },
  screen: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  stepSubtitle: {
    color: '#6b7280',
    fontSize: 15,
  },
  stepTitle: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
  },
  toggleCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleDescription: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  toggleTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  uploadButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: '#e5e7eb',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  uploadButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#f87171', // Soft red from mockup
    borderRadius: 12,
    marginTop: 16,
  },
});
