import { calculateRoute } from '@/services/maps/osm';
import type { Database } from '@/types/database';

import { supabase } from './client';

export type DonorMatch = Database['public']['Tables']['donor_matches']['Row'];

export type MatchedBloodRequestDetails = Pick<
  Database['public']['Tables']['blood_requests']['Row'],
  | 'id'
  | 'blood_type'
  | 'units_needed'
  | 'status'
  | 'urgency'
  | 'patient_name'
  | 'hospital_name'
  | 'contact_phone'
  | 'notes'
  | 'needed_at'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'created_at'
  | 'updated_at'
>;

const DUPLICATE_MATCH_ERROR_CODE = '23505';

const MATCHED_BLOOD_REQUEST_COLUMNS =
  'id,blood_type,units_needed,status,urgency,patient_name,hospital_name,contact_phone,notes,needed_at,address,latitude,longitude,created_at,updated_at' as const;

export type RespondToBloodRequestOptions = {
  donorLatitude?: number | null;
  donorLongitude?: number | null;
  requestLatitude?: number | null;
  requestLongitude?: number | null;
};

export type RespondToBloodRequestResult =
  | { kind: 'created'; match: DonorMatch }
  | { kind: 'duplicate'; match: DonorMatch }
  | { kind: 'error'; message: string };

export const getDonorMatchForRequest = (requestId: string, donorId: string) =>
  supabase
    .from('donor_matches')
    .select('*')
    .eq('request_id', requestId)
    .eq('donor_id', donorId)
    .maybeSingle();

/** Readable only when blood_requests RLS authorizes the current user (e.g. after a match). */
export const getAuthorizedBloodRequestById = (requestId: string) =>
  supabase
    .from('blood_requests')
    .select(MATCHED_BLOOD_REQUEST_COLUMNS)
    .eq('id', requestId)
    .maybeSingle();

const buildMatchMetrics = async ({
  donorLatitude,
  donorLongitude,
  requestLatitude,
  requestLongitude,
}: RespondToBloodRequestOptions) => {
  if (
    donorLatitude == null ||
    donorLongitude == null ||
    requestLatitude == null ||
    requestLongitude == null
  ) {
    return { distanceMeters: null, travelTimeSeconds: null };
  }

  try {
    const route = await calculateRoute(
      { latitude: donorLatitude, longitude: donorLongitude },
      { latitude: requestLatitude, longitude: requestLongitude },
    );

    return {
      distanceMeters: route.distanceMeters,
      travelTimeSeconds: Math.round(route.durationSeconds),
    };
  } catch {
    return { distanceMeters: null, travelTimeSeconds: null };
  }
};

export const respondToBloodRequest = async (
  requestId: string,
  donorId: string,
  options: RespondToBloodRequestOptions = {},
): Promise<RespondToBloodRequestResult> => {
  const { data: existingMatch, error: existingError } = await getDonorMatchForRequest(
    requestId,
    donorId,
  );

  if (existingError) {
    return { kind: 'error', message: existingError.message };
  }

  if (existingMatch) {
    return { kind: 'duplicate', match: existingMatch };
  }

  const { distanceMeters, travelTimeSeconds } = await buildMatchMetrics(options);

  const { data, error } = await supabase
    .from('donor_matches')
    .insert({
      donor_id: donorId,
      distance_meters: distanceMeters,
      request_id: requestId,
      responded_at: new Date().toISOString(),
      status: 'pending',
      travel_time_seconds: travelTimeSeconds,
    })
    .select()
    .single();

  if (error) {
    if (error.code === DUPLICATE_MATCH_ERROR_CODE) {
      const { data: racedMatch, error: racedError } = await getDonorMatchForRequest(
        requestId,
        donorId,
      );

      if (racedMatch) {
        return { kind: 'duplicate', match: racedMatch };
      }

      if (racedError) {
        return { kind: 'error', message: racedError.message };
      }
    }

    return { kind: 'error', message: error.message };
  }

  return { kind: 'created', match: data };
};

export const canShowSensitiveRequestDetails = (match: DonorMatch | null) =>
  match?.status === 'accepted' || match?.status === 'completed';
