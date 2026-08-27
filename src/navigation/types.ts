import type { NavigatorScreenParams } from '@react-navigation/native';

import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { NearbyMapDonorItem } from '@/services/supabase/nearbyMapDonors';
import type { BloodType } from '@/types/database';

export type AuthStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  VerifyEmail: {
    email: string;
    resent?: boolean;
  };
  EnterPhone: {
    mode: 'signup' | 'login';
  };
  VerifyOtp: {
    phone: string;
    mode: 'signup' | 'login';
  };
  Login: undefined;
};

export type AppStackParamList = {
  AppTabs: NavigatorScreenParams<AppTabParamList> | undefined;
  HemieAI: undefined;
  EditProfile: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  ProfilePicture: undefined;
  SettingsDetail: {
    description: string;
    title: string;
  };
  DonorRequestDetail: { requestId: string };
  MyDonations: undefined;
  DonationQr: { matchId: string; donationId?: string };
  ProfileQr: undefined;
  MyBloodRequests: undefined;
  CreateBloodRequest: { bloodType?: BloodType } | undefined;
  BloodRequestDetail: { requestId: string };
  ChatThread: {
    bloodRequestId: string;
    donorMatchId: string;
    recipientId: string;
    recipientDisplayName?: string;
  };
  Notifications: undefined;
  NearbyDonorDetail: { donor: NearbyMapDonorItem };
};
