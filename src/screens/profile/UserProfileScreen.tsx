import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Award,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  CircleHelp,
  Droplet,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Settings,
  Shield,
  UserRound,
} from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DonorVerificationBadge } from '@/components/donor/DonorVerificationBadge';
import { ModeToggle } from '@/components/common/ModeToggle';
import { Skeleton } from '@/components/common/Skeleton';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useUserMode, type UserMode } from '@/context/UserModeContext';
import { useSignOut } from '@/hooks/useSignOut';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { supabase } from '@/services/supabase/client';
import {
  listDonorVerifiableItems,
  type DonorDonationListItem,
} from '@/services/supabase/donations';
import {
  getLatestDonorVerification,
  getProfile,
  isDonorVerificationActive,
} from '@/services/supabase/profiles';
import { getDonorEligibilityStat } from '@/utils/donorDonationStats';
import {
  resolveDonorVerificationDisplay,
  type DonorVerificationDisplay,
} from '@/utils/donorVerificationDisplay';
import { formatRoleLabel } from '@/utils/profileDisplay';
import { sanitizeProfileError } from '@/utils/profileErrors';
import { profileScreenStyles as styles } from './profileScreenStyles';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'AppProfile'>,
  NativeStackScreenProps<AppStackParamList>
>;

const formatDonationDate = (value: string | null) => {
  if (!value) {
    return 'Date pending';
  }

  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const computeResponseRate = (statuses: string[]) => {
  const responded = statuses.filter((status) =>
    ['accepted', 'declined', 'completed'].includes(status),
  );

  if (responded.length === 0) {
    return null;
  }

  const positive = responded.filter((status) => status === 'accepted' || status === 'completed')
    .length;

  return Math.round((positive / responded.length) * 100);
};

const getModeDisplayLabel = (mode: UserMode) =>
  mode === 'donate' ? 'Donate' : 'Request';

const getModeSubtitle = (mode: UserMode, role: string | null | undefined) => {
  if (mode === 'request') {
    return role === 'recipient'
      ? 'Finding compatible donors for your requests'
      : 'Browsing as a requester to find compatible donors';
  }

  return role === 'donor'
    ? 'Ready to respond to nearby blood requests'
    : 'Available to help when donors are needed nearby';
};

function ProfileSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Skeleton height={28} width={100} />
      </View>
      <View style={styles.scrollContent}>
        <Skeleton borderRadius={24} height={220} width="100%" />
        <Skeleton borderRadius={16} height={180} width="100%" />
        <Skeleton borderRadius={16} height={200} width="100%" />
        <Skeleton borderRadius={16} height={240} width="100%" />
      </View>
    </View>
  );
}

function ContactInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactIconWrap}>{icon}</View>
      <View style={styles.contactValueWrap}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
    </View>
  );
}

function ProfileMenuRow({
  badge,
  icon,
  label,
  onPress,
  showDivider,
}: {
  badge?: number;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.menuRow, pressed ? { opacity: 0.7 } : null]}
        onPress={onPress}
      >
        <View style={styles.menuIconWrap}>{icon}</View>
        <Text style={styles.menuLabel}>{label}</Text>
        {badge != null && badge > 0 ? (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        ) : null}
        <ChevronRight color={colors.mutedLight} size={20} />
      </Pressable>
      {showDivider ? <View style={styles.menuRowDivider} /> : null}
    </>
  );
}

function RecentDonationRow({ item }: { item: DonorDonationListItem }) {
  const isCompleted =
    item.donationStatus === 'completed' || item.matchStatus === 'completed';

  return (
    <View style={styles.donationItem}>
      <View style={styles.donationIconWrap}>
        <Calendar color={colors.primary} size={18} />
      </View>
      <View style={styles.donationTextWrap}>
        <Text style={styles.donationHospital}>{item.hospitalName}</Text>
        <Text style={styles.donationDate}>
          {formatDonationDate(item.completedAt ?? item.scheduledAt ?? item.createdAt)}
        </Text>
      </View>
      {isCompleted ? (
        <View
          style={{
            alignItems: 'center',
            backgroundColor: colors.successSoft,
            borderRadius: 999,
            height: 28,
            justifyContent: 'center',
            width: 28,
          }}
        >
          <Check color={colors.success} size={16} strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
}

export function UserProfileScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { profile, refreshProfile, session } = useAuth();
  const { mode } = useUserMode();
  const { clearSignOutError, confirmSignOut, signOutError, signingOut } = useSignOut();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donorVerificationStatus, setDonorVerificationStatus] =
    useState<DonorVerificationDisplay>('pending');
  const [totalDonations, setTotalDonations] = useState(0);
  const [responseRate, setResponseRate] = useState<number | null>(null);
  const [recentDonations, setRecentDonations] = useState<DonorDonationListItem[]>([]);

  const isDonor = profile?.role === 'donor';
  const email = session?.user.email?.trim() || null;
  const phone = profile?.phone?.trim() || session?.user.phone?.trim() || null;
  const location = profile?.address?.trim() || null;
  const eligibilityStat = getDonorEligibilityStat(profile?.last_donation_at);

  const navigateToStack = useCallback(
    <RouteName extends keyof AppStackParamList>(
      screen: RouteName,
      ...args: undefined extends AppStackParamList[RouteName]
        ? [params?: AppStackParamList[RouteName]]
        : [params: AppStackParamList[RouteName]]
    ) => {
      const stackNavigation = navigation.getParent();
      if (stackNavigation) {
        stackNavigation.navigate(screen, ...args);
        return;
      }
    },
    [navigation],
  );

  const loadProfileData = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }

    setError(null);

    try {
      await refreshProfile();

      const { data: freshProfile } = await getProfile(session.user.id);

      if (freshProfile?.role !== 'donor') {
        setDonorVerificationStatus('pending');
        setTotalDonations(0);
        setResponseRate(null);
        setRecentDonations([]);
        return;
      }

      const [donationsResult, verificationResult, latestVerificationResult, matchesResult] =
        await Promise.all([
          listDonorVerifiableItems(session.user.id),
          isDonorVerificationActive(session.user.id),
          getLatestDonorVerification(session.user.id),
          supabase.from('donor_matches').select('status').eq('donor_id', session.user.id),
        ]);

      if (donationsResult.error) {
        throw donationsResult.error;
      }

      if (verificationResult.error) {
        throw verificationResult.error;
      }

      if (latestVerificationResult.error) {
        throw latestVerificationResult.error;
      }

      if (matchesResult.error) {
        throw matchesResult.error;
      }

      setDonorVerificationStatus(
        resolveDonorVerificationDisplay({
          latestStatus: latestVerificationResult.data?.status ?? null,
          verificationActive: Boolean(verificationResult.data),
        }),
      );

      const completedDonations = (donationsResult.data ?? []).filter(
        (item) => item.donationStatus === 'completed' || item.matchStatus === 'completed',
      );
      setTotalDonations(completedDonations.length);

      const statuses = (matchesResult.data ?? []).map((match) => match.status);
      setResponseRate(computeResponseRate(statuses));

      setRecentDonations(
        [...completedDonations]
          .sort((left, right) => {
            const leftDate = new Date(left.completedAt ?? left.createdAt).getTime();
            const rightDate = new Date(right.completedAt ?? right.createdAt).getTime();
            return rightDate - leftDate;
          })
          .slice(0, 3),
      );
    } catch (loadError) {
      setError(sanitizeProfileError(loadError, 'Unable to load profile data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshProfile, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadProfileData();
    }, [loadProfileData]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadProfileData();
  };

  if (loading && !profile) {
    return <ProfileSkeleton topInset={topInset} />;
  }

  if (!profile) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: topInset + 8 }]}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile unavailable</Text>
            <Text style={styles.emptyDonationsText}>
              We could not load your profile details right now.
            </Text>
            {error ? <Text style={authStyles.error}>{error}</Text> : null}
          </View>
        </View>
      </View>
    );
  }

  const displayName = profile.full_name?.trim() || 'BloodLink user';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            style={styles.headerSettingsButton}
            onPress={() => navigateToStack('Settings')}
          >
            <Settings color={colors.foreground} size={20} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <>
            <Skeleton borderRadius={24} height={220} width="100%" />
            <Skeleton borderRadius={16} height={180} width="100%" />
          </>
        ) : (
          <>
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <View style={styles.avatarWrap}>
                  <ProfileAvatar
                    avatarPath={profile.avatar_path}
                    fullName={profile.full_name}
                    size={72}
                  />
                </View>

                <View style={styles.overviewMeta}>
                  <View style={styles.nameRow}>
                    <Text numberOfLines={1} style={styles.userName}>
                      {displayName}
                    </Text>
                    {isDonor ? (
                      <DonorVerificationBadge status={donorVerificationStatus} />
                    ) : null}
                  </View>
                  <Text style={styles.roleLabel}>
                    {formatRoleLabel(profile.role)} account
                  </Text>
                  {profile.blood_type ? (
                    <View style={styles.bloodTypePill}>
                      <Droplet color={colors.primary} fill={colors.primary} size={14} />
                      <Text style={styles.bloodTypePillText}>
                        {profile.blood_type} Blood Type
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />
              <View style={styles.modeSection}>
                <Text style={styles.modeStatusLabel}>
                  {getModeDisplayLabel(mode)} mode
                </Text>
                <Text style={styles.modeSubtitle}>
                  {getModeSubtitle(mode, profile.role)}
                </Text>
                <View style={styles.modeToggleWrap}>
                  <ModeToggle />
                </View>
              </View>

              {isDonor ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.statRow}>
                    <View style={styles.statColumn}>
                      <Text style={styles.statValue}>{totalDonations}</Text>
                      <Text style={styles.statLabel}>Donations</Text>
                    </View>
                    <View style={styles.statColumn}>
                      <Text style={styles.statValue}>{eligibilityStat.value}</Text>
                      <Text style={styles.statLabel}>{eligibilityStat.label}</Text>
                    </View>
                    <View style={styles.statColumn}>
                      <Text style={styles.statValue}>
                        {responseRate == null ? '—' : `${responseRate}%`}
                      </Text>
                      <Text style={styles.statLabel}>Response</Text>
                    </View>
                  </View>
                </>
              ) : null}

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.editProfileButton,
                  pressed ? { opacity: 0.7 } : null,
                ]}
                onPress={() => navigateToStack('EditProfile')}
              >
                <UserRound color={colors.foreground} size={18} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact Information</Text>
              {email ? (
                <ContactInfoRow
                  icon={<Mail color={colors.primary} size={18} />}
                  label="Email"
                  value={email}
                />
              ) : null}
              {phone ? (
                <ContactInfoRow
                  icon={<Phone color={colors.primary} size={18} />}
                  label="Phone"
                  value={phone}
                />
              ) : null}
              <ContactInfoRow
                icon={<MapPin color={colors.primary} size={18} />}
                label="Location"
                value={location || 'Not set'}
              />
            </View>

            {isDonor ? (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.cardTitle}>Recent Donations</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => navigateToStack('MyDonations')}
                  >
                    <Text style={styles.linkText}>View All</Text>
                  </Pressable>
                </View>
                {recentDonations.length === 0 ? (
                  <Text style={styles.emptyDonationsText}>
                    No completed donations yet. Your donation history will appear here.
                  </Text>
                ) : (
                  recentDonations.map((item) => (
                    <RecentDonationRow key={item.matchId} item={item} />
                  ))
                )}
              </View>
            ) : null}

            <View style={styles.card}>
              <ProfileMenuRow
                icon={<Bell color={colors.primary} size={18} />}
                label="Notifications"
                showDivider
                onPress={() => navigateToStack('Notifications')}
              />
              <ProfileMenuRow
                icon={<Shield color={colors.primary} size={18} />}
                label="Privacy & Security"
                showDivider={isDonor}
                onPress={() => navigateToStack('Settings')}
              />
              {isDonor ? (
                <ProfileMenuRow
                  icon={<Award color={colors.primary} size={18} />}
                  label="Donation History"
                  showDivider
                  onPress={() => navigateToStack('MyDonations')}
                />
              ) : null}
              <ProfileMenuRow
                icon={<CircleHelp color={colors.primary} size={18} />}
                label="Help & Support"
                onPress={() => navigateToStack('HemieAI')}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={signingOut}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed || signingOut ? { opacity: 0.7 } : null,
              ]}
              onPress={() => {
                clearSignOutError();
                confirmSignOut();
              }}
            >
              <LogOut color={colors.primary} size={18} />
              <Text style={styles.logoutText}>{signingOut ? 'Signing out…' : 'Logout'}</Text>
            </Pressable>

            {error ? <Text style={authStyles.error}>{error}</Text> : null}
            {signOutError ? <Text style={authStyles.error}>{signOutError}</Text> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
