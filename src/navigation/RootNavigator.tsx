import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '@/context/AuthContext';
import { AuthProfileErrorScreen } from '@/screens/AuthProfileErrorScreen';
import { RestrictedAccessScreen } from '@/screens/RestrictedAccessScreen';
import { isAdminRole, isBloodbankRole, isMobileAppRole } from '@/utils/roles';
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
  const showDonorRecipientApp = Boolean(
    session && (profilePending || (profileComplete && isMobileAppRole(profile?.role))),
  );
  const showBloodBankApp = Boolean(session && profile && isBloodbankRole(profile.role));
  const showRestrictedAccess = Boolean(session && profile && isAdminRole(profile.role));
  const showProfileSetup = Boolean(
    session && profile && !profileComplete && isMobileAppRole(profile.role),
  );

  if (authError) {
    return <AuthProfileErrorScreen />;
  }

  return (
    <NavigationContainer>
      {!session ? (
        <AuthNavigator />
      ) : showRestrictedAccess ? (
        <RestrictedAccessScreen />
      ) : showBloodBankApp ? (
        <BloodBankNavigator verificationStatus={bloodbankVerification?.status ?? 'pending'} />
      ) : showProfileSetup ? (
        <ProfileSetupNavigator />
      ) : showDonorRecipientApp ? (
        <AppNavigator />
      ) : (
        <ProfileSetupNavigator />
      )}
    </NavigationContainer>
  );
}
