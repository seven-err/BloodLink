import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { DonationQrScreen } from '@/screens/donor/DonationQrScreen';
import { DonorOpenRequestsMapScreen } from '@/screens/donor/DonorOpenRequestsMapScreen';
import { DonorRequestDetailScreen } from '@/screens/donor/DonorRequestDetailScreen';
import { DonorRequestFeedScreen } from '@/screens/donor/DonorRequestFeedScreen';
import { MyDonationsScreen } from '@/screens/donor/MyDonationsScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { SettingsScreen } from '@/screens/profile/SettingsScreen';
import { UserProfileScreen } from '@/screens/profile/UserProfileScreen';
import { BloodRequestDetailScreen } from '@/screens/recipient/BloodRequestDetailScreen';
import { CreateBloodRequestScreen } from '@/screens/recipient/CreateBloodRequestScreen';
import { MyBloodRequestsScreen } from '@/screens/recipient/MyBloodRequestsScreen';
import { ChatThreadScreen } from '@/screens/ChatThreadScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { RestrictedAccessScreen } from '@/screens/RestrictedAccessScreen';
import { isMobileAppRole } from '@/utils/roles';

const Stack = createNativeStackNavigator<AppStackParamList>();

type HomeRouteName = 'DonorHome' | 'RecipientHome';
type HomeProps =
  | NativeStackScreenProps<AppStackParamList, 'DonorHome'>
  | NativeStackScreenProps<AppStackParamList, 'RecipientHome'>;

const homeContent = {
  DonorHome: {
    actionTitle: 'View donor profile',
    eyebrow: 'Donor dashboard',
    sections: [
      { key: 'availability', label: 'Availability', route: 'AppProfile' as const },
      { key: 'nearby', label: 'Nearby requests', route: 'DonorRequestFeed' as const },
      { key: 'donations', label: 'My donations', route: 'MyDonations' as const },
      { key: 'notifications', label: 'Notifications', route: 'Notifications' as const },
    ],
    subtitle: 'Track availability, nearby requests, matches, and donation reminders here.',
  },
  RecipientHome: {
    actionTitle: 'View recipient profile',
    eyebrow: 'Recipient dashboard',
    sections: [
      { key: 'requests', label: 'Blood requests', route: 'MyBloodRequests' as const },
      { key: 'matches', label: 'Donor matches', route: 'MyBloodRequests' as const },
      { key: 'notifications', label: 'Notifications', route: 'Notifications' as const },
    ],
    subtitle: 'Create requests, follow donor matches, and receive request updates here.',
  },
} satisfies Record<
  HomeRouteName,
  {
    actionTitle: string;
    eyebrow: string;
    sections: Array<{
      key: string;
      label: string;
      route: keyof AppStackParamList | null;
    }>;
    subtitle: string;
  }
>;

function RoleHomeScreen({ navigation, route }: HomeProps) {
  const { profile } = useAuth();
  const content = homeContent[route.name];

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{content.eyebrow}</Text>
        <Text style={styles.title}>
          {profile?.full_name ? `Hi, ${profile.full_name}` : 'Welcome to BloodLink'}
        </Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>
      </View>

      <View style={styles.sectionGrid}>
        {content.sections.map((section) => {
          const card = (
            <View
              key={section.key}
              style={[styles.sectionCard, section.route ? styles.sectionCardInteractive : null]}
            >
              <Text style={styles.sectionText}>{section.label}</Text>
            </View>
          );

          if (!section.route) {
            return card;
          }

          return (
            <Pressable
              key={section.key}
              style={styles.sectionPressable}
              onPress={() => navigation.navigate(section.route!)}
            >
              {card}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        {route.name === 'RecipientHome' ? (
          <PrimaryButton
            title="Create blood request"
            onPress={() => navigation.navigate('CreateBloodRequest')}
          />
        ) : null}
        <PrimaryButton
          title={content.actionTitle}
          onPress={() => navigation.navigate('AppProfile')}
        />
        <PrimaryButton
          title="Settings"
          variant="secondary"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
    </View>
  );
}

export function AppNavigator() {
  const { profile } = useAuth();

  if (!isMobileAppRole(profile?.role)) {
    return <RestrictedAccessScreen />;
  }

  const initialRouteName: HomeRouteName =
    profile.role === 'donor' ? 'DonorHome' : 'RecipientHome';

  return (
    <Stack.Navigator
      key={initialRouteName}
      initialRouteName={initialRouteName}
      screenOptions={{
        contentStyle: {
          backgroundColor: '#fef2f2',
        },
        headerShadowVisible: false,
        headerTintColor: '#991b1b',
      }}
    >
      <Stack.Screen
        component={RoleHomeScreen}
        name="DonorHome"
        options={{ headerBackVisible: false, title: 'Donor Home' }}
      />
      <Stack.Screen
        component={RoleHomeScreen}
        name="RecipientHome"
        options={{ headerBackVisible: false, title: 'Recipient Home' }}
      />
      <Stack.Screen
        component={UserProfileScreen}
        name="AppProfile"
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        component={EditProfileScreen}
        name="EditProfile"
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        component={SettingsScreen}
        name="Settings"
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        component={DonorRequestFeedScreen}
        name="DonorRequestFeed"
        options={({ navigation }) => ({
          title: 'Open Blood Requests',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('DonorOpenRequestsMap')}
            >
              <Text style={{ color: '#991b1b', fontWeight: '700' }}>Map</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        component={DonorOpenRequestsMapScreen}
        name="DonorOpenRequestsMap"
        options={({ navigation }) => ({
          title: 'Requests Map',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('DonorRequestFeed')}
            >
              <Text style={{ color: '#991b1b', fontWeight: '700' }}>List</Text>
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        component={DonorRequestDetailScreen}
        name="DonorRequestDetail"
        options={{ title: 'Request Preview' }}
      />
      <Stack.Screen
        component={MyDonationsScreen}
        name="MyDonations"
        options={{ title: 'My Donations' }}
      />
      <Stack.Screen
        component={DonationQrScreen}
        name="DonationQr"
        options={{ title: 'Donation QR' }}
      />
      <Stack.Screen
        component={MyBloodRequestsScreen}
        name="MyBloodRequests"
        options={{ title: 'My Blood Requests' }}
      />
      <Stack.Screen
        component={CreateBloodRequestScreen}
        name="CreateBloodRequest"
        options={{ title: 'Create Request' }}
      />
      <Stack.Screen
        component={BloodRequestDetailScreen}
        name="BloodRequestDetail"
        options={{ title: 'Request Details' }}
      />
      <Stack.Screen
        component={ChatThreadScreen}
        name="ChatThread"
        options={({ route }) => ({
          title: route.params.recipientDisplayName?.trim() || 'Chat',
        })}
      />
      <Stack.Screen
        component={NotificationsScreen}
        name="Notifications"
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    gap: 10,
    padding: 24,
  },
  eyebrow: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  screen: {
    flex: 1,
    gap: 18,
    justifyContent: 'center',
    padding: 24,
  },
  sectionCard: {
    backgroundColor: '#fff7f7',
    borderColor: '#fecaca',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 120,
    padding: 14,
  },
  sectionCardInteractive: {
    backgroundColor: '#fff',
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionPressable: {
    flex: 1,
    minWidth: 120,
  },
  sectionText: {
    color: '#7f1d1d',
    fontWeight: '700',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: '#991b1b',
    fontSize: 30,
    fontWeight: '800',
  },
});
