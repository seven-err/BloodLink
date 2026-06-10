import {
  isDonorRecipientProfileComplete,
  type Profile,
} from '@/services/supabase/profiles';

export const canDonorEnableAvailability = (
  profile: Profile | null | undefined,
  verificationActive: boolean,
) => verificationActive || (profile ? isDonorRecipientProfileComplete(profile) : false);
