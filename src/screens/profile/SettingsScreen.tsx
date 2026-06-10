import * as Location from 'expo-location';
import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Bell,
  Camera,
  CircleHelp,
  Globe,
  Info,
  LogOut,
  MapPin,
  MessageSquare,
  Moon,
  Shield,
  Trash2,
  UserRound,
} from 'lucide-react-native';
import { Alert, ScrollView, Text, View } from 'react-native';

import { SettingsRow } from '@/components/settings/SettingsRow';import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsToggle } from '@/components/settings/SettingsToggle';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';
import type { AppStackParamList } from '@/navigation/types';
import { setDonorMapVisibility } from '@/services/supabase/profiles';
import { authStyles } from '@/screens/auth/styles';
import { sanitizeProfileError } from '@/utils/profileErrors';
import { settingsStyles } from './settingsStyles';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

const APP_VERSION = '1.0.0';

export function SettingsScreen({ navigation }: Props) {
  const { profile, refreshProfile, session } = useAuth();
  const { clearSignOutError, confirmSignOut, signOutError, signingOut } = useSignOut();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [mapVisibilityLoading, setMapVisibilityLoading] = useState(false);
  const [mapVisibilityError, setMapVisibilityError] = useState<string | null>(null);

  const isDonor = profile?.role === 'donor';

  const handleMapVisibilityToggle = async (visibleOnMap: boolean) => {
    if (!session?.user.id || mapVisibilityLoading) {
      return;
    }

    setMapVisibilityLoading(true);
    setMapVisibilityError(null);

    let latitude = profile?.latitude ?? null;
    let longitude = profile?.longitude ?? null;

    if (visibleOnMap && (latitude == null || longitude == null)) {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setMapVisibilityError('Location permission is required to appear on the donor map.');
        setMapVisibilityLoading(false);
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {
        setMapVisibilityError('Unable to read your location. Try again from the Map tab.');
        setMapVisibilityLoading(false);
        return;
      }
    }

    const { error } = await setDonorMapVisibility({
      userId: session.user.id,
      visibleOnMap,
      latitude,
      longitude,
    });

    if (error) {
      setMapVisibilityError(
        sanitizeProfileError(error, 'Unable to update map visibility. Please try again.'),
      );
    } else {
      await refreshProfile();
    }

    setMapVisibilityLoading(false);
  };

  const openDetail = (title: string, description: string) => {
    navigation.navigate('SettingsDetail', { description, title });
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This action is permanent. Your profile, requests, and donation history will be removed.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Delete account',
          onPress: () => {
            Alert.alert(
              'Contact support',
              'Account deletion is handled by BloodLink support. Email support@bloodlink.app to continue.',
            );
          },
        },
      ],
    );
  };

  return (
    <View style={settingsStyles.screen}>
      <SettingsScreenHeader title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={settingsStyles.scrollContent}>
        <SettingsSection title="Notifications">
          <SettingsRow
            icon={<Bell color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Push Notifications"
            showDivider
            subtitle="Receive app notifications"
            trailing={
              <SettingsToggle value={pushNotifications} onValueChange={setPushNotifications} />
            }
            showChevron={false}
          />
          <SettingsRow
            icon={<Bell color={colors.primary} size={22} strokeWidth={1.75} />}
            label="Emergency Alerts"
            showDivider
            subtitle="Critical blood request alerts"
            trailing={
              <SettingsToggle value={emergencyAlerts} onValueChange={setEmergencyAlerts} />
            }
            showChevron={false}
          />
          <SettingsRow
            icon={<MessageSquare color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Message Notifications"
            subtitle="New messages from recipients"
            trailing={
              <SettingsToggle value={messageNotifications} onValueChange={setMessageNotifications} />
            }
            showChevron={false}
          />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingsRow
            icon={<Camera color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Profile Picture"
            showDivider
            subtitle="Update your photo"
            onPress={() => navigation.navigate('ProfilePicture')}
          />
          <SettingsRow
            icon={<UserRound color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Account Settings"
            subtitle="Name, email, and phone number"
            onPress={() => navigation.navigate('AccountSettings')}
          />
        </SettingsSection>

        <SettingsSection title="Privacy & Security">
          <SettingsRow
            icon={<Shield color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Privacy Settings"
            showDivider
            onPress={() =>
              openDetail(
                'Privacy Settings',
                'Control who can see your profile details, contact information, and donation activity. BloodLink only shares the minimum information required for safe coordination.',
              )
            }
          />
          <SettingsRow
            icon={<Shield color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Data Security"
            onPress={() =>
              openDetail(
                'Data Security',
                'Your account data is encrypted in transit and stored securely. Verification records, staff roles, and protected health details are never editable from the mobile app.',
              )
            }
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsRow
            icon={<MapPin color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Location Services"
            showDivider={isDonor}
            subtitle="Find nearby donors and requests"
            trailing={<SettingsToggle value={locationServices} onValueChange={setLocationServices} />}
            showChevron={false}
          />
          {isDonor ? (
            <SettingsRow
              icon={<MapPin color={colors.primary} size={22} strokeWidth={1.75} />}
              label="Show on Donor Map"
              subtitle="Let verified users see your approximate pin"
              trailing={
                <SettingsToggle
                  disabled={mapVisibilityLoading}
                  value={profile?.visible_on_map ?? false}
                  onValueChange={(value) => void handleMapVisibilityToggle(value)}
                />
              }
              showChevron={false}
            />
          ) : null}
          <SettingsRow
            icon={<Globe color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Language"
            showDivider
            trailing={<Text style={settingsStyles.rowTrailingText}>English</Text>}
            onPress={() =>
              Alert.alert('Language', 'Additional languages will be available in a future update.')
            }
          />
          <SettingsRow
            icon={<Moon color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Dark Mode"
            trailing={<SettingsToggle value={darkMode} onValueChange={setDarkMode} />}
            showChevron={false}
          />
        </SettingsSection>

        {mapVisibilityError ? (
          <Text style={[authStyles.error, { marginHorizontal: 24 }]}>{mapVisibilityError}</Text>
        ) : null}

        <SettingsSection title="Support">
          <SettingsRow
            icon={<CircleHelp color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="Help Center"
            showDivider
            onPress={() => navigation.navigate('HemieAI')}
          />
          <SettingsRow
            icon={<Info color={colors.foreground} size={22} strokeWidth={1.75} />}
            label="About BloodLink"
            onPress={() =>
              openDetail(
                'About BloodLink',
                'BloodLink connects blood donors with recipients who need help fast. Built for safe coordination, verified profiles, and life-saving response when every minute counts.',
              )
            }
          />
        </SettingsSection>

        <SettingsSection title="Account Actions">
          <SettingsRow
            icon={<LogOut color={colors.foreground} size={22} strokeWidth={1.75} />}
            label={signingOut ? 'Signing out…' : 'Logout'}
            showChevron={false}
            showDivider
            onPress={() => {
              if (signingOut) {
                return;
              }

              clearSignOutError();
              confirmSignOut();
            }}
          />
          <SettingsRow
            destructive
            icon={<Trash2 color={colors.primary} size={22} strokeWidth={1.75} />}
            label="Delete Account"
            showChevron={false}
            onPress={confirmDeleteAccount}
          />
        </SettingsSection>

        {signOutError ? <Text style={authStyles.error}>{signOutError}</Text> : null}

        <View style={settingsStyles.footer}>
          <Text style={settingsStyles.footerText}>BloodLink v{APP_VERSION}</Text>
          <Text style={settingsStyles.footerText}>© 2026 BloodLink. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
