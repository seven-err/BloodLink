import type { DonorVerificationStatus } from '@/types/database';

export type DonorVerificationDisplay = 'verified' | 'pending' | 'rejected';

export const resolveDonorVerificationDisplay = ({
  latestStatus,
  verificationActive,
}: {
  latestStatus?: DonorVerificationStatus | null;
  verificationActive?: boolean;
}): DonorVerificationDisplay => {
  if (verificationActive) {
    return 'verified';
  }

  if (latestStatus === 'rejected') {
    return 'rejected';
  }

  return 'pending';
};
