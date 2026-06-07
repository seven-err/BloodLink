import type { BloodType, DonationStatus, DonorMatchStatus } from '@/types/database';
import type { Database } from '@/types/database';
import {
  buildDonationQrPayload,
  serializeDonationQrPayload,
  type DonationQrPayload,
} from '@/utils/donationQr';

import { supabase } from './client';

export type Donation = Database['public']['Tables']['donations']['Row'];

const DONATION_LIST_COLUMNS =
  'id,match_id,donor_id,request_id,status,scheduled_at,completed_at,created_at,updated_at' as const;

const SAFE_BLOOD_REQUEST_COLUMNS =
  'blood_type,units_needed,urgency,hospital_name,needed_at' as const;

type SafeBloodRequestSummary = Pick<
  Database['public']['Tables']['blood_requests']['Row'],
  'blood_type' | 'units_needed' | 'urgency' | 'hospital_name' | 'needed_at'
>;

export type DonorDonationListItem = {
  donationId: string | null;
  matchId: string;
  requestId: string;
  matchStatus: DonorMatchStatus;
  donationStatus: DonationStatus | null;
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  bloodType: BloodType;
  unitsNeeded: number;
  urgency: SafeBloodRequestSummary['urgency'];
  hospitalName: string;
  neededAt: string | null;
};

export type DonationQrDetails = {
  donation: Donation;
  summary: SafeBloodRequestSummary;
  payload: DonationQrPayload;
  payloadText: string;
};

export type EnsureDonationResult =
  | { kind: 'success'; donation: Donation }
  | { kind: 'not_found' }
  | { kind: 'not_eligible'; message: string }
  | { kind: 'error'; message: string };

export type DonationQrResult =
  | { kind: 'success'; details: DonationQrDetails }
  | { kind: 'not_found' }
  | { kind: 'not_eligible'; message: string }
  | { kind: 'error'; message: string };

const QR_ELIGIBLE_MATCH_STATUSES: DonorMatchStatus[] = ['accepted', 'completed'];

export const isQrEligibleMatchStatus = (status: DonorMatchStatus) =>
  QR_ELIGIBLE_MATCH_STATUSES.includes(status);

const mapDonationListItem = (
  match: {
    id: string;
    request_id: string;
    status: DonorMatchStatus;
    created_at: string;
    blood_requests: SafeBloodRequestSummary | SafeBloodRequestSummary[] | null;
  },
  donation:
    | Pick<
        Donation,
        'id' | 'status' | 'scheduled_at' | 'completed_at' | 'created_at'
      >
    | null,
): DonorDonationListItem | null => {
  const request = Array.isArray(match.blood_requests)
    ? match.blood_requests[0]
    : match.blood_requests;

  if (!request) {
    return null;
  }

  return {
    donationId: donation?.id ?? null,
    matchId: match.id,
    requestId: match.request_id,
    matchStatus: match.status,
    donationStatus: donation?.status ?? null,
    scheduledAt: donation?.scheduled_at ?? null,
    completedAt: donation?.completed_at ?? null,
    createdAt: donation?.created_at ?? match.created_at,
    bloodType: request.blood_type,
    unitsNeeded: request.units_needed,
    urgency: request.urgency,
    hospitalName: request.hospital_name,
    neededAt: request.needed_at,
  };
};

export const listDonorVerifiableItems = async (donorId: string) => {
  const { data: matches, error: matchError } = await supabase
    .from('donor_matches')
    .select('id,request_id,status,created_at')
    .eq('donor_id', donorId)
    .in('status', QR_ELIGIBLE_MATCH_STATUSES)
    .order('created_at', { ascending: false });

  if (matchError) {
    return { data: null, error: matchError };
  }

  const matchRows = matches ?? [];

  if (matchRows.length === 0) {
    return { data: [], error: null };
  }

  const requestIds = [...new Set(matchRows.map((match) => match.request_id))];

  const [{ data: donations, error: donationError }, { data: requests, error: requestError }] =
    await Promise.all([
      supabase.from('donations').select(DONATION_LIST_COLUMNS).eq('donor_id', donorId),
      supabase.from('blood_requests').select(`id,${SAFE_BLOOD_REQUEST_COLUMNS}`).in('id', requestIds),
    ]);

  if (donationError) {
    return { data: null, error: donationError };
  }

  if (requestError) {
    return { data: null, error: requestError };
  }

  const donationsByMatchId = new Map(
    (donations ?? []).map((donation) => [donation.match_id, donation]),
  );
  const requestsById = new Map((requests ?? []).map((request) => [request.id, request]));

  const items = matchRows
    .map((match) => {
      const request = requestsById.get(match.request_id);

      if (!request) {
        return null;
      }

      return mapDonationListItem(
        {
          ...match,
          blood_requests: request,
        },
        donationsByMatchId.get(match.id) ?? null,
      );
    })
    .filter((item): item is DonorDonationListItem => item !== null);

  return { data: items, error: null };
};

export const getDonationForDonor = (donationId: string, donorId: string) =>
  supabase
    .from('donations')
    .select('*')
    .eq('id', donationId)
    .eq('donor_id', donorId)
    .maybeSingle();

export const ensureDonationForAcceptedMatch = async (
  matchId: string,
): Promise<EnsureDonationResult> => {
  const { data, error } = await supabase.rpc('ensure_donation_for_accepted_match', {
    p_match_id: matchId,
  });

  if (error) {
    if (error.code === '42501' || error.message.includes('access denied')) {
      return { kind: 'not_found' };
    }

    if (error.code === '22023' || error.message.includes('accepted matches')) {
      return {
        kind: 'not_eligible',
        message: 'A donation QR code is available only after your match is accepted.',
      };
    }

    return { kind: 'error', message: error.message };
  }

  if (!data) {
    return { kind: 'not_found' };
  }

  return { kind: 'success', donation: data };
};

const loadSafeRequestSummary = async (requestId: string) =>
  supabase
    .from('blood_requests')
    .select(SAFE_BLOOD_REQUEST_COLUMNS)
    .eq('id', requestId)
    .maybeSingle();

export const getDonationQrDetailsForDonor = async (
  donorId: string,
  options: { donationId?: string; matchId?: string },
): Promise<DonationQrResult> => {
  let donation: Donation | null = null;

  if (options.donationId) {
    const { data, error } = await getDonationForDonor(options.donationId, donorId);

    if (error) {
      return { kind: 'error', message: error.message };
    }

    if (!data) {
      return { kind: 'not_found' };
    }

    donation = data;
  } else if (options.matchId) {
    const ensureResult = await ensureDonationForAcceptedMatch(options.matchId);

    if (ensureResult.kind !== 'success') {
      return ensureResult;
    }

    if (ensureResult.donation.donor_id !== donorId) {
      return { kind: 'not_found' };
    }

    donation = ensureResult.donation;
  } else {
    return { kind: 'error', message: 'A donation or match identifier is required.' };
  }

  const { data: summary, error: summaryError } = await loadSafeRequestSummary(
    donation.request_id,
  );

  if (summaryError) {
    return { kind: 'error', message: summaryError.message };
  }

  if (!summary) {
    return { kind: 'not_found' };
  }

  const payload = buildDonationQrPayload(donation.id, donation.verification_token);

  return {
    kind: 'success',
    details: {
      donation,
      summary,
      payload,
      payloadText: serializeDonationQrPayload(payload),
    },
  };
};
