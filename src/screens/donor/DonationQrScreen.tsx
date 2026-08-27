import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import { Skeleton } from '@/components/common/Skeleton';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  getDonationQrDetailsForDonor,
  type DonationQrDetails,
} from '@/services/supabase/donations';

type Props = NativeStackScreenProps<AppStackParamList, 'DonationQr'>;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not set';
  }

  return new Date(value).toLocaleString();
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={recipientStyles.detailLabel}>{label}</Text>
      <Text style={recipientStyles.detailValue}>{value}</Text>
    </View>
  );
}

function QrSuccessView({ details }: { details: DonationQrDetails }) {
  const { donation, summary, payloadText } = details;

  return (
    <>
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Verification QR</Text>
        <Text style={recipientStyles.title}>Show this at collection</Text>
        <Text style={recipientStyles.subtitle}>
          Staff will scan this code to verify your donation match. It does not include patient or
          contact details.
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
            <QRCode size={220} value={payloadText} />
          </View>
        </View>
      </View>

      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Donation summary</Text>
        <DetailRow label="Blood type" value={summary.blood_type} />
        <DetailRow
          label="Units"
          value={`${summary.units_needed} unit${summary.units_needed === 1 ? '' : 's'}`}
        />
        <DetailRow label="Urgency" value={URGENCY_LABELS[summary.urgency]} />
        <DetailRow label="Hospital" value={summary.hospital_name} />
        <DetailRow label="Needed by" value={formatDateTime(summary.needed_at)} />
        <DetailRow label="Donation status" value={donation.status.replace('_', ' ')} />
        <DetailRow label="Scheduled" value={formatDateTime(donation.scheduled_at)} />
      </View>
    </>
  );
}

import { appCache } from '@/utils/appCache';

export function DonationQrScreen({ navigation, route }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { donationId, matchId } = route.params;
  const { session } = useAuth();
  const donorId = session?.user.id;

  const cacheKey = `donation_qr:${donationId ?? ''}:${matchId ?? ''}`;
  const cachedDetails = appCache.getSync<DonationQrDetails>(cacheKey);

  const [details, setDetails] = useState<DonationQrDetails | null>(() => cachedDetails ?? null);
  const [loading, setLoading] = useState(() => !cachedDetails);
  const [error, setError] = useState<string | null>(null);
  const [ineligibleMessage, setIneligibleMessage] = useState<string | null>(null);

  const loadQrDetails = useCallback(async (isSilent = false) => {
    if (!donorId) {
      setError('You need to be signed in as a donor to view this QR code.');
      setLoading(false);
      return;
    }

    if (!isSilent && !appCache.getSync(cacheKey)) {
      setLoading(true);
    }
    setError(null);
    setIneligibleMessage(null);

    const result = await getDonationQrDetailsForDonor(donorId, { donationId, matchId });

    if (result.kind === 'success') {
      setDetails(result.details);
      appCache.setSync(cacheKey, result.details);
      setLoading(false);
      return;
    }

    if (result.kind === 'not_eligible') {
      setIneligibleMessage(result.message);
      setLoading(false);
      return;
    }

    if (result.kind === 'not_found') {
      setError('This donation record was not found or you do not have access.');
      setLoading(false);
      return;
    }

    setError(result.message);
    setLoading(false);
  }, [cacheKey, donationId, donorId, matchId]);

  useFocusEffect(
    useCallback(() => {
      void loadQrDetails(true);
    }, [loadQrDetails]),
  );

  if (loading) {
    return (
      <View style={[recipientStyles.screen, { gap: 16, padding: 24, paddingTop: topInset + 16 }]}>
        <Skeleton borderRadius={16} height={96} width="100%" />
        <Skeleton borderRadius={16} height={280} width="100%" />
        <Skeleton borderRadius={16} height={120} width="100%" />
      </View>
    );
  }

  if (ineligibleMessage) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={recipientStyles.subtitle}>{ineligibleMessage}</Text>
        <PrimaryButton title="Back to donations" onPress={() => navigation.navigate('MyDonations')} />
      </View>
    );
  }

  if (error || !details) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error ?? 'Unable to load donation QR code.'}</Text>
        <PrimaryButton title="Try again" onPress={() => void loadQrDetails()} />
        <PrimaryButton
          title="Back to donations"
          variant="secondary"
          onPress={() => navigation.navigate('MyDonations')}
        />
      </View>
    );
  }

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
          Donation QR Pass
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={recipientStyles.scrollContent}
        style={{ flex: 1 }}
      >
        <QrSuccessView details={details} />
        <PrimaryButton title="Back to donations" onPress={() => navigation.navigate('MyDonations')} />
      </ScrollView>
    </View>
  );
}
