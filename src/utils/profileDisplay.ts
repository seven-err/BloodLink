import type { DonorVerificationStatus, UserRole } from '@/types/database';

export const formatRoleLabel = (role: UserRole | null | undefined) => {
  switch (role) {
    case 'donor':
      return 'Donor';
    case 'recipient':
      return 'Recipient';
    case 'bloodbank':
      return 'Blood bank staff';
    case 'admin':
      return 'Administrator';
    default:
      return 'Unknown';
  }
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleDateString();
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
};

export const formatWeight = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return 'Not set';
  }

  return `${value} kg`;
};

export const formatVerificationStatus = (status: DonorVerificationStatus | null | undefined) => {
  switch (status) {
    case 'approved':
      return 'Verified';
    case 'pending':
      return 'Pending review';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired';
    default:
      return 'Not submitted';
  }
};

export const formatAvailability = (isAvailable: boolean) =>
  isAvailable ? 'Available for requests' : 'Unavailable';
