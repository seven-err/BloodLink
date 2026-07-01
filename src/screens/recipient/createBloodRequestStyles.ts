import { StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

export const createBloodRequestStyles = StyleSheet.create({
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodTypeOption: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: '22.5%',
  },
  bloodTypeOptionSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  bloodTypeText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
  bloodTypeTextSelected: {
    color: colors.primary,
  },
  errorText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    color: colors.foreground,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  helperText: {
    color: colors.mutedLight,
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    color: colors.foreground,
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  inputShell: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  inputShellError: {
    borderColor: colors.primary,
  },
  inputShellWithIcon: {
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 12,
  },
  locationIcon: {
    marginTop: 2,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    gap: 18,
    padding: 24,
    paddingBottom: 24,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonPressed: {
    opacity: 0.92,
  },
  submitButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '800',
  },
  uploadBox: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: 8,
    justifyContent: 'center',
    minHeight: 132,
    padding: 20,
  },
  uploadBoxPressed: {
    opacity: 0.92,
  },
  uploadHint: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadName: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  urgencyOption: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
    width: '47.5%',
  },
  urgencyOptionCriticalSelected: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  urgencyOptionHighSelected: {
    backgroundColor: colors.orangeSoft,
    borderColor: colors.warning,
  },
  urgencyOptionLowSelected: {
    backgroundColor: colors.infoSoft,
    borderColor: colors.info,
  },
  urgencyOptionMediumSelected: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
  },
  urgencyText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  urgencyTextCriticalSelected: {
    color: colors.primary,
  },
  urgencyTextHighSelected: {
    color: colors.orangeText,
  },
  urgencyTextLowSelected: {
    color: colors.infoText,
  },
  urgencyTextMediumSelected: {
    color: colors.warningText,
  },
});
