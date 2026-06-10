import type { BloodRequestUrgency, BloodType } from '@/types/database';
import type { Database } from '@/types/database';

import { supabase } from './client';

export type BloodRequest = Database['public']['Tables']['blood_requests']['Row'];

export type CreateBloodRequestInput = {
  requesterId: string;
  bloodType: BloodType;
  unitsNeeded: number;
  urgency: BloodRequestUrgency;
  neededAt: string;
  patientName: string;
  hospitalName: string;
  contactPhone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  attachmentPath?: string | null;
};

export const createBloodRequest = ({
  requesterId,
  bloodType,
  unitsNeeded,
  urgency,
  neededAt,
  patientName,
  hospitalName,
  contactPhone,
  address,
  latitude,
  longitude,
  notes,
  attachmentPath,
}: CreateBloodRequestInput) =>
  supabase
    .from('blood_requests')
    .insert({
      address: address.trim(),
      attachment_path: attachmentPath ?? null,
      blood_type: bloodType,
      contact_phone: contactPhone.trim(),
      hospital_name: hospitalName.trim(),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      needed_at: neededAt,
      notes: notes?.trim() || null,
      patient_name: patientName.trim(),
      requester_id: requesterId,
      status: 'open',
      units_needed: unitsNeeded,
      urgency,
    })
    .select()
    .single();

export const getMyBloodRequests = (requesterId: string) =>
  supabase
    .from('blood_requests')
    .select('*')
    .eq('requester_id', requesterId)
    .order('created_at', { ascending: false });

export const getBloodRequestById = (requestId: string) =>
  supabase.from('blood_requests').select('*').eq('id', requestId).maybeSingle();
