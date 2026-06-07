import type { BloodType, UserRole } from '@/types/database';
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
