export type AuthStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  EnterPhone: {
    mode: 'signup' | 'login';
  };
  VerifyOtp: {
    phone: string;
    mode: 'signup' | 'login';
  };
  Login: undefined;
  ProfileCompletion: undefined;
};

export type AppStackParamList = {
  DonorHome: undefined;
  RecipientHome: undefined;
  AppProfile: undefined;
  DonorRequestFeed: undefined;
  DonorOpenRequestsMap: undefined;
  DonorRequestDetail: { requestId: string };
  MyDonations: undefined;
  DonationQr: { matchId: string; donationId?: string };
  MyBloodRequests: undefined;
  CreateBloodRequest: undefined;
  BloodRequestDetail: { requestId: string };
  ChatThread: {
    bloodRequestId: string;
    donorMatchId: string;
    recipientId: string;
    recipientDisplayName?: string;
  };
  Notifications: undefined;
};
