import type { User } from '@supabase/supabase-js';

import type {
  BloodType,
  DonorVerificationStatus,
  OnboardingRole,
} from '@/types/database';
import { supabase } from './client';

export type Profile = Awaited<ReturnType<typeof getProfile>>['data'];

export type ProfileCompletionInput = {
  userId: string;
  fullName: string;
  role: OnboardingRole;
  bloodType?: BloodType | null;
  birthdate?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  weightKg?: number | null;
  lastDonationAt?: string | null;
  lastTransfusionDate?: string | null;
  isAvailable?: boolean;
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

const metadataPhone = (user: User) => {
  const phone = user.user_metadata?.phone;

  return typeof phone === 'string' && phone.trim() ? phone.trim() : null;
};

const metadataFullName = (user: User) => {
  const fullName = user.user_metadata?.full_name;

  return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : null;
};

export const syncProfileFromAuthUser = async (user: User) => {
  const phone = metadataPhone(user);
  const fullName = metadataFullName(user);

  if (!phone && !fullName) {
    return getProfile(user.id);
  }

  const { data: profile, error: profileError } = await getProfile(user.id);

  if (profileError) {
    return { data: profile, error: profileError };
  }

  if (!profile) {
    return supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: fullName ?? user.email?.split('@')[0] ?? 'BloodLink User',
        phone,
        role: 'recipient',
      })
      .select()
      .single();
  }

  const updates: { full_name?: string; phone?: string } = {};

  if (!profile.phone && phone) {
    updates.phone = phone;
  }

  if (!profile.full_name?.trim() && fullName) {
    updates.full_name = fullName;
  }

  if (Object.keys(updates).length === 0) {
    return { data: profile, error: null };
  }

  return supabase.from('profiles').update(updates).eq('id', user.id).select().single();
};

export const syncMissingProfilePhone = async (userId: string, phone: string | undefined) => {
  const normalizedPhone = phone?.trim();

  if (!normalizedPhone) {
    return { data: null, error: null };
  }

  const { data: profile, error: readError } = await getProfile(userId);

  if (readError) {
    return { data: null, error: readError };
  }

  if (profile?.phone?.trim()) {
    return { data: profile, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ phone: normalizedPhone })
    .eq('id', userId)
    .is('phone', null)
    .select()
    .maybeSingle();

  return { data: data ?? profile, error };
};

export const isDonorRecipientProfileComplete = (profile: Profile) => {
  if (!profile) {
    return false;
  }

  const hasBaseFields = Boolean(profile.full_name?.trim());

  if (profile.role === 'donor') {
    return (
      hasBaseFields &&
      Boolean(profile.blood_type) &&
      Boolean(profile.birthdate) &&
      profile.weight_kg !== null &&
      profile.weight_kg >= 50
    );
  }

  if (profile.role === 'recipient') {
    return hasBaseFields && Boolean(profile.blood_type);
  }

  return false;
};

export const isProfileComplete = (profile: Profile) => {
  if (!profile) {
    return false;
  }

  if (profile.role === 'bloodbank' || profile.role === 'admin') {
    return false;
  }

  return isDonorRecipientProfileComplete(profile);
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
  phone,
  weightKg,
  lastDonationAt,
  isAvailable,
}: ProfileCompletionInput) =>
  supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        role,
        blood_type: role === 'donor' || role === 'recipient' ? bloodType : null,
        birthdate: role === 'donor' ? birthdate ?? null : null,
        address: address?.trim() ? address.trim() : null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        weight_kg: role === 'donor' ? weightKg ?? null : null,
        last_donation_at: role === 'donor' ? lastDonationAt ?? null : null,
        is_available: role === 'donor' ? Boolean(isAvailable) : false,
        ...(phone?.trim() ? { phone: phone.trim() } : {}),
      },
      {
        onConflict: 'id',
      },
    )
    .select()
    .single();

export type AccountContactUpdateInput = {
  userId: string;
  fullName: string;
  phone: string | null;
};

export const updateProfileAvatarPath = (userId: string, avatarPath: string | null) =>
  supabase
    .from('profiles')
    .update({ avatar_path: avatarPath })
    .eq('id', userId)
    .select()
    .single();

export const updateAccountContact = ({ userId, fullName, phone }: AccountContactUpdateInput) =>
  supabase
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      phone,
    })
    .eq('id', userId)
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

export type DonorMapVisibilityInput = {
  userId: string;
  visibleOnMap: boolean;
  latitude?: number | null;
  longitude?: number | null;
};

export const setDonorMapVisibility = ({
  userId,
  visibleOnMap,
  latitude,
  longitude,
}: DonorMapVisibilityInput) => {
  const updates: {
    visible_on_map: boolean;
    latitude?: number;
    longitude?: number;
  } = {
    visible_on_map: visibleOnMap,
  };

  if (
    visibleOnMap &&
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    updates.latitude = latitude;
    updates.longitude = longitude;
  }

  return supabase.from('profiles').update(updates).eq('id', userId).select().single();
};
