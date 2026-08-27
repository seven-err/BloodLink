import type { DonorVerificationStatus } from '@/types/database';

export type DonorVerificationDisplay = 'verified' | 'pending' | 'rejected';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const resolveDonorVerificationDisplay = (_params?: {
  latestStatus?: DonorVerificationStatus | null;
  verificationActive?: boolean;
}): DonorVerificationDisplay => {
  // Bypass pending and rejected for now; all registered donors are verified immediately
  return 'verified';
};
