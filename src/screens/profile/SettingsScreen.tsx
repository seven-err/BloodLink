import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { formatRoleLabel } from '@/utils/profileDisplay';
import { profileStyles } from './styles';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { profile, session } = useAuth();
  const { clearSignOutError, confirmSignOut, signOutError, signingOut } = useSignOut();
  const email = session?.user.email?.trim() || null;
  const phone = profile?.phone?.trim() || session?.user.phone?.trim() || null;

  return (
    <ScrollView contentContainerStyle={profileStyles.listContent} style={profileStyles.screen}>
      <View style={profileStyles.card}>
        <Text style={profileStyles.eyebrow}>Settings</Text>
        <Text style={profileStyles.title}>Account</Text>
        <Text style={profileStyles.subtitle}>
          Manage your session and review what account information is visible in the app.
        </Text>
      </View>

      <View style={profileStyles.settingsRow}>
        <Text style={profileStyles.detailLabel}>Signed in as</Text>
        <Text style={profileStyles.detailValue}>
          {profile?.full_name?.trim() || 'BloodLink user'}
        </Text>
        <Text style={profileStyles.helper}>Role: {formatRoleLabel(profile?.role)}</Text>
        {email ? <Text style={profileStyles.helper}>Email: {email}</Text> : null}
        {phone ? <Text style={profileStyles.helper}>Phone: {phone}</Text> : null}
      </View>

      <View style={profileStyles.settingsRow}>
        <Text style={profileStyles.sectionTitle}>Privacy</Text>
        <Text style={profileStyles.helper}>
          BloodLink only shows your profile details to you. Other users see limited match
          information required for coordination, not your full account record.
        </Text>
        <Text style={profileStyles.helper}>
          Protected fields such as staff roles, verification records, and donation history are not
          editable from this screen.
        </Text>
      </View>

      <View style={profileStyles.actions}>
        <PrimaryButton title="View profile" onPress={() => navigation.navigate('AppProfile')} />
        <PrimaryButton
          loading={signingOut}
          title="Sign out"
          variant="secondary"
          onPress={() => {
            clearSignOutError();
            confirmSignOut();
          }}
        />
        {signOutError ? <Text style={authStyles.error}>{signOutError}</Text> : null}
      </View>
    </ScrollView>
  );
}
