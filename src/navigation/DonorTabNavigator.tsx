import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FileText, Home, Map, MessageCircle, User } from 'lucide-react-native';
import { colors } from '@/constants/theme';
import { DonorHomeScreen } from '@/screens/donor/DonorHomeScreen';
import { NearbyDonorsMapScreen } from '@/screens/donor/NearbyDonorsMapScreen';
import { DonorRequestFeedScreen } from '@/screens/donor/DonorRequestFeedScreen';
import { MessagesScreen } from '@/screens/messages/MessagesScreen';
import { UserProfileScreen } from '@/screens/profile/UserProfileScreen';

export type DonorTabParamList = {
  DonorHome: undefined;
  DonorRequestFeed: undefined;
  DonorOpenRequestsMap: undefined;
  DonorMessages: undefined;
  AppProfile: undefined;
};

const Tab = createBottomTabNavigator<DonorTabParamList>();

const tabIcon =
  (Icon: typeof Home) =>
  ({ color, size }: { color: string; size: number }) => <Icon color={color} size={size} />;

export function DonorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.primaryDark,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedLight,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        component={DonorHomeScreen}
        name="DonorHome"
        options={{
          headerShown: false,
          tabBarIcon: tabIcon(Home),
          title: 'Home',
        }}
      />
      <Tab.Screen
        component={DonorRequestFeedScreen}
        name="DonorRequestFeed"
        options={{
          headerShown: false,
          tabBarIcon: tabIcon(FileText),
          title: 'Requests',
        }}
      />
      <Tab.Screen
        component={NearbyDonorsMapScreen}
        name="DonorOpenRequestsMap"
        options={{
          headerShown: false,
          tabBarIcon: tabIcon(Map),
          title: 'Map',
        }}
      />
      <Tab.Screen
        component={MessagesScreen}
        name="DonorMessages"
        options={{
          headerShown: false,
          tabBarIcon: tabIcon(MessageCircle),
          title: 'Chat',
        }}
      />
      <Tab.Screen
        component={UserProfileScreen}
        name="AppProfile"
        options={{
          headerShown: false,
          tabBarIcon: tabIcon(User),
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
