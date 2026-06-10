import type { BloodType } from '@/types/database';

const RECIPIENT_CAN_RECEIVE_FROM: Record<BloodType, BloodType[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export const isDonorCompatibleWithRecipient = (
  donorBloodType: BloodType | string | null | undefined,
  recipientBloodType: BloodType | string,
): boolean => {
  if (!donorBloodType || !(donorBloodType in RECIPIENT_CAN_RECEIVE_FROM)) {
    return false;
  }

  if (!(recipientBloodType in RECIPIENT_CAN_RECEIVE_FROM)) {
    return false;
  }

  return RECIPIENT_CAN_RECEIVE_FROM[recipientBloodType as BloodType].includes(
    donorBloodType as BloodType,
  );
};

const COMPATIBILITY_LABELS: Record<BloodType, string> = {
  'O-': 'All types (Universal)',
  'O+': 'O+, A+, B+, AB+',
  'A-': 'A-, A+, AB-, AB+',
  'A+': 'A+, AB+',
  'B-': 'B-, B+, AB-, AB+',
  'B+': 'B+, AB+',
  'AB-': 'AB-, AB+',
  'AB+': 'AB+ only',
};

export const getBloodTypeCompatibilityLabel = (bloodType: BloodType | string | null | undefined) => {
  if (!bloodType || !(bloodType in COMPATIBILITY_LABELS)) {
    return 'Set your blood type in profile';
  }

  return COMPATIBILITY_LABELS[bloodType as BloodType];
};

export const getRecipientCanReceiveFromLabel = (
  bloodType: BloodType | string | null | undefined,
) => {
  if (!bloodType || !(bloodType in RECIPIENT_CAN_RECEIVE_FROM)) {
    return 'Set your blood type in profile';
  }

  return RECIPIENT_CAN_RECEIVE_FROM[bloodType as BloodType].join(', ');
};
