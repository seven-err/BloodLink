import type { BloodType, DonorVerificationStatus, UserRole } from '@/types/database';
import { supabase } from './client';

export type Profile = Awaited<ReturnType<typeof getProfile>>['data'];

export type ProfileCompletionInput = {
  userId: string;
  fullName: string;
  role: Extract<UserRole, 'donor' | 'recipient'>;
  bloodType?: BloodType | null;
  birthdate: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type ProfileUpdateInput = {
  userId: string;
  fullName: string;
  bloodType?: BloodType | null;
  birthdate: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  weightKg?: number | null;
  isDonor: boolean;
};

export type DonorVerificationSummary = {
  status: DonorVerificationStatus;
  expires_at: string | null;
  reviewed_at: string | null;
} | null;

export const getProfile = (userId: string) =>
  supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

export const isProfileComplete = (profile: Profile) => {
  if (!profile) {
    return false;
  }

  const hasBaseFields =
    Boolean(profile.full_name?.trim()) &&
    Boolean(profile.birthdate) &&
    Boolean(profile.address?.trim());

  if (profile.role === 'donor') {
    return hasBaseFields && Boolean(profile.blood_type);
  }

  return hasBaseFields && profile.role === 'recipient';
};

export const completeProfile = ({
  userId,
  fullName,
  role,
  bloodType,
  birthdate,
  address,
  latitude,
  longitude,
}: ProfileCompletionInput) =>
  supabase
    .from('profiles')
    .upsert({
      id: userId,
      full_name: fullName.trim(),
      role,
      blood_type: role === 'donor' ? bloodType : null,
      birthdate,
      address: address.trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    }, {
      onConflict: 'id',
    })
    .select()
    .single();

export const updateProfile = ({
  userId,
  fullName,
  bloodType,
  birthdate,
  address,
  latitude,
  longitude,
  weightKg,
  isDonor,
}: ProfileUpdateInput) =>
  supabase
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      blood_type: isDonor ? bloodType ?? null : null,
      birthdate,
      address: address.trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      weight_kg: isDonor ? weightKg ?? null : null,
    })
    .eq('id', userId)
    .select()
    .single();

export const getLatestDonorVerification = (donorId: string) =>
  supabase
    .from('donor_verifications')
    .select('status, expires_at, reviewed_at')
    .eq('donor_id', donorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

export const isDonorVerificationActive = (donorId: string) =>
  supabase.rpc('is_donor_verification_active', { donor_id: donorId });

export const setDonorAvailability = (userId: string, isAvailable: boolean) =>
  supabase
    .from('profiles')
    .update({ is_available: isAvailable })
    .eq('id', userId)
    .select()
    .single();
