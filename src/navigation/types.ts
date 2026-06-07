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
  DonorRequestDetail: { requestId: string };
  MyBloodRequests: undefined;
  CreateBloodRequest: undefined;
  BloodRequestDetail: { requestId: string };
};
