import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { recipientStyles } from '@/screens/recipient/styles';
import { formatRoleLabel } from '@/utils/profileDisplay';

type Props = NativeStackScreenProps<AppStackParamList, 'ProfileQr'>;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={recipientStyles.detailLabel}>{label}</Text>
      <Text style={recipientStyles.detailValue}>{value}</Text>
    </View>
  );
}

export function ProfileQrScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { profile, session } = useAuth();

  if (!profile || !session) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={recipientStyles.subtitle}>Please sign in to view your QR pass.</Text>
        <PrimaryButton title="Go back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const qrPayload = JSON.stringify({
    userId: session.user.id,
    fullName: profile.full_name,
    bloodType: profile.blood_type,
    role: profile.role,
    isAvailable: profile.is_available,
  });

  return (
    <View style={recipientStyles.screen}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingBottom: 12,
          paddingHorizontal: 16,
          paddingTop: topInset + 8,
        }}
      >
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={colors.foreground} size={22} />
        </Pressable>
        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>
          Profile QR Pass
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={recipientStyles.scrollContent}
        style={{ flex: 1 }}
      >
        <View style={recipientStyles.card}>
          <Text style={recipientStyles.eyebrow}>Profile QR Pass</Text>
          <Text style={recipientStyles.title}>Verification Code</Text>
          <Text style={recipientStyles.subtitle}>
            Show this QR code to authorized healthcare or blood bank personnel for quick verification of your eligibility and profile details.
          </Text>
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderColor: colors.border,
                borderRadius: 20,
                borderWidth: 1,
                padding: 16,
              }}
            >
              <QRCode size={220} value={qrPayload} />
            </View>
          </View>
        </View>

        <View style={recipientStyles.card}>
          <Text style={recipientStyles.eyebrow}>Member details</Text>
          <DetailRow label="Full Name" value={profile.full_name} />
          <DetailRow label="Blood Type" value={profile.blood_type ?? 'Not set'} />
          <DetailRow label="Role" value={formatRoleLabel(profile.role)} />
          <DetailRow
            label="Availability"
            value={profile.is_available ? 'Available for emergency requests' : 'Currently unavailable'}
          />
        </View>

        <PrimaryButton title="Back to profile" onPress={() => navigation.goBack()} />
      </ScrollView>
    </View>
  );
}
