import type { BloodType } from '@/types/database';
import { haversineDistanceMeters } from '@/utils/coordinates';
import { supabase } from './client';

export type NearbyMapDonorItem = {
  donorId: string;
  fullName: string;
  bloodType: BloodType;
  isAvailable: boolean;
  latitude: number;
  longitude: number;
  donationCount: number;
  lastDonationAt: string | null;
  isVerified: boolean;
  distanceMeters: number;
};

type NearbyMapDonorRow = {
  donor_id: string;
  full_name: string;
  blood_type: BloodType;
  is_available: boolean;
  latitude: number;
  longitude: number;
  donation_count: number;
  last_donation_at: string | null;
  is_verified: boolean;
};

export type NearbyMapDonorsQuery = {
  originLatitude: number;
  originLongitude: number;
  radiusKm?: number;
  maxResults?: number;
  bloodType?: BloodType | null;
  availableOnly?: boolean;
};

const mapNearbyMapDonorRow = (
  row: NearbyMapDonorRow,
  originLatitude: number,
  originLongitude: number,
): NearbyMapDonorItem => {
  const distanceMeters = haversineDistanceMeters(
    { latitude: originLatitude, longitude: originLongitude },
    { latitude: row.latitude, longitude: row.longitude },
  );

  return {
    donorId: row.donor_id,
    fullName: row.full_name,
    bloodType: row.blood_type,
    isAvailable: row.is_available,
    latitude: row.latitude,
    longitude: row.longitude,
    donationCount: Number(row.donation_count ?? 0),
    lastDonationAt: row.last_donation_at,
    isVerified: row.is_verified,
    distanceMeters,
  };
};

export const getNearbyMapDonors = async ({
  originLatitude,
  originLongitude,
  radiusKm = 5,
  maxResults = 50,
  bloodType = null,
  availableOnly = false,
}: NearbyMapDonorsQuery) => {
  const { data, error } = await supabase.rpc('nearby_map_donors', {
    origin_lat: originLatitude,
    origin_lng: originLongitude,
    radius_km: radiusKm,
    max_results: maxResults,
    filter_blood_type: bloodType,
    available_only: availableOnly,
  });

  if (error) {
    return { data: null, error };
  }

  const rows = (data ?? []) as NearbyMapDonorRow[];

  return {
    data: rows.map((row) => mapNearbyMapDonorRow(row, originLatitude, originLongitude)),
    error: null,
  };
};
