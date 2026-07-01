import type { BloodbankVerificationStatus } from '@/types/database';
import type { LocalDocument } from './storageUpload';
import { uploadStaffDocuments } from './storageUpload';
import { supabase } from './client';

export type BloodbankVerification = {
  id: string;
  profile_id: string;
  status: BloodbankVerificationStatus;
  position: string;
  employee_id: string;
  hospital_name: string;
  branch_location: string;
  work_email: string;
  work_phone: string;
  document_paths: string[];
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BloodbankVerificationInput = {
  userId: string;
  fullName: string;
  phone: string;
  position: string;
  employeeId: string;
  hospitalName: string;
  branchLocation: string;
  workEmail: string;
  workPhone: string;
  documents: LocalDocument[];
};

export const getBloodbankVerification = (profileId: string) =>
  supabase
    .from('bloodbank_verifications')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

export const submitBloodbankVerification = async ({
  userId,
  fullName,
  phone,
  position,
  employeeId,
  hospitalName,
  branchLocation,
  workEmail,
  workPhone,
  documents,
}: BloodbankVerificationInput) => {
  const documentPaths = await uploadStaffDocuments(userId, documents);

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: 'bloodbank',
        organization_name: hospitalName.trim(),
      },
      { onConflict: 'id' },
    );

  if (profileError) {
    return { data: null, error: profileError };
  }

  const existing = await getBloodbankVerification(userId);

  if (existing.data?.status === 'rejected') {
    return supabase
      .from('bloodbank_verifications')
      .update({
        status: 'pending',
        position: position.trim(),
        employee_id: employeeId.trim(),
        hospital_name: hospitalName.trim(),
        branch_location: branchLocation.trim(),
        work_email: workEmail.trim(),
        work_phone: workPhone.trim(),
        document_paths: documentPaths,
        notes: null,
        reviewed_by: null,
        reviewed_at: null,
      })
      .eq('profile_id', userId)
      .select()
      .single();
  }

  return supabase
    .from('bloodbank_verifications')
    .insert({
      profile_id: userId,
      status: 'pending',
      position: position.trim(),
      employee_id: employeeId.trim(),
      hospital_name: hospitalName.trim(),
      branch_location: branchLocation.trim(),
      work_email: workEmail.trim(),
      work_phone: workPhone.trim(),
      document_paths: documentPaths,
    })
    .select()
    .single();
};

export const isBloodbankOnboardingComplete = (
  verification: BloodbankVerification | null | undefined,
) => Boolean(verification);

export const isBloodbankApproved = (
  verification: BloodbankVerification | null | undefined,
) => verification?.status === 'approved';
