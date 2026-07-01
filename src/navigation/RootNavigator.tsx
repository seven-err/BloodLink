import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { AuthProfileErrorScreen } from '@/screens/AuthProfileErrorScreen';
import { RestrictedAccessScreen } from '@/screens/RestrictedAccessScreen';
import { isMobileAppRole } from '@/utils/roles';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { BloodBankNavigator } from './BloodBankNavigator';
import { ProfileSetupNavigator } from './ProfileSetupNavigator';

export function RootNavigator() {
  const {
    authError,
    bloodbankVerification,
    profile,
    profileComplete,
    profileLoading,
    session,
  } = useAuth();

  const profilePending = Boolean(session && profileLoading && !profile);
  const isAdmin = profile?.role === 'admin';
  const isBloodbank = profile?.role === 'bloodbank';
  const showBloodbankApp = Boolean(
    session && isBloodbank && profileComplete && bloodbankVerification,
  );
  const showDonorRecipientApp = Boolean(
    session && (profilePending || (profileComplete && isMobileAppRole(profile?.role))),
  );
  const showProfileSetup = Boolean(session && profile && !profileComplete);
  const showRestrictedAccess = Boolean(session && profile && isAdmin);

  if (authError) {
    return <AuthProfileErrorScreen />;
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthNavigator />
      ) : showRestrictedAccess ? (
        <RestrictedAccessScreen />
      ) : showProfileSetup ? (
        <ProfileSetupNavigator />
      ) : showBloodbankApp ? (
        <BloodBankNavigator verificationStatus={bloodbankVerification!.status} />
      ) : showDonorRecipientApp ? (
        <AppNavigator />
      ) : (
        <ProfileSetupNavigator />
      )}
    </NavigationContainer>
  );
}
