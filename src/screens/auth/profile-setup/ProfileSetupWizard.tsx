import * as Location from 'expo-location';
import { Building2, Camera, Heart, MapPin, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FormTextInput } from '@/components/forms/FormTextInput';
import { BLOOD_TYPES } from '@/constants/bloodTypes';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { submitBloodbankVerification } from '@/services/supabase/bloodbankVerifications';
import type { LocalDocument } from '@/services/supabase/storageUpload';
import { completeProfile } from '@/services/supabase/profiles';
import type { BloodType, OnboardingRole } from '@/types/database';
import { getDonorEligibilityIssues } from '@/utils/donorEligibility';
import { AuthBrand } from '../AuthBrand';
import { authStyles } from '../styles';
import { DocumentPickerField } from './components/DocumentPickerField';
import { EligibilityCallout } from './components/EligibilityCallout';
import { ProfileSetupProgress } from './components/ProfileSetupProgress';
import { RoleSelectionCard } from './components/RoleSelectionCard';
import { ToggleSettingCard } from './components/ToggleSettingCard';
import { profileSetupStyles } from './styles';

type BasicInfo = {
  fullName: string;
  email: string;
  phone: string;
};

type DonorDetails = {
  availableToDonate: boolean;
  birthdate: string;
  bloodType: BloodType | null;
  enableLocation: boolean;
  lastDonationDate: string;
  lastTransfusionDate: string;
  weightKg: string;
};

type RecipientDetails = {
  bloodType: BloodType | null;
  enableLocation: boolean;
};

type BloodbankDetails = {
  branchLocation: string;
  documents: LocalDocument[];
  employeeId: string;
  hospitalName: string;
  position: string;
  workEmail: string;
  workPhone: string;
};

const getPrefillValue = (
  profileValue: string | null | undefined,
  metadataValue: unknown,
  sessionValue?: string | null,
) => {
  if (profileValue?.trim()) {
    return profileValue.trim();
  }

  if (typeof metadataValue === 'string' && metadataValue.trim()) {
    return metadataValue.trim();
  }

  return sessionValue?.trim() ?? '';
};

export function ProfileSetupWizard() {
  const { profile, refreshProfile, session } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coordinates, setCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: profile?.latitude ?? null,
    longitude: profile?.longitude ?? null,
  });

  const prefilledBasicInfo = useMemo<BasicInfo>(() => {
    const metadata = session?.user.user_metadata ?? {};

    return {
      email: session?.user.email ?? '',
      fullName: getPrefillValue(profile?.full_name, metadata.full_name),
      phone: getPrefillValue(profile?.phone, metadata.phone),
    };
  }, [profile?.full_name, profile?.phone, session?.user.email, session?.user.user_metadata]);

  const [basicInfo, setBasicInfo] = useState<BasicInfo>(prefilledBasicInfo);
  const [role, setRole] = useState<OnboardingRole | null>(null);
  const [donorDetails, setDonorDetails] = useState<DonorDetails>({
    availableToDonate: true,
    birthdate: profile?.birthdate ?? '',
    bloodType: profile?.blood_type ?? null,
    enableLocation: false,
    lastDonationDate: profile?.last_donation_at ?? '',
    lastTransfusionDate: '',
    weightKg: profile?.weight_kg ? String(profile.weight_kg) : '',
  });
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails>({
    bloodType: profile?.blood_type ?? null,
    enableLocation: false,
  });
  const [bloodbankDetails, setBloodbankDetails] = useState<BloodbankDetails>({
    branchLocation: '',
    documents: [],
    employeeId: '',
    hospitalName: profile?.organization_name ?? '',
    position: '',
    workEmail: session?.user.email ?? '',
    workPhone: prefilledBasicInfo.phone,
  });

  useEffect(() => {
    setBasicInfo(prefilledBasicInfo);
    setBloodbankDetails((current) => ({
      ...current,
      workEmail: prefilledBasicInfo.email || current.workEmail,
      workPhone: prefilledBasicInfo.phone || current.workPhone,
    }));
  }, [prefilledBasicInfo]);

  const hasPrefilledName = Boolean(prefilledBasicInfo.fullName);
  const hasPrefilledPhone = Boolean(prefilledBasicInfo.phone);
  const hasPrefilledEmail = Boolean(prefilledBasicInfo.email);

  const stepTitle =
    step === 1
      ? 'Set Up Your Profile'
      : step === 2
        ? 'Choose Your Role'
        : 'Health Information';

  const stepSubtitle =
    step === 1
      ? 'Step 1 of 3: Basic Information'
      : step === 2
        ? 'Step 2 of 3: Account Type'
        : role === 'bloodbank'
          ? 'Step 3 of 3: Work Verification'
          : role === 'recipient'
            ? 'Step 3 of 3: Recipient Details'
            : 'Step 3 of 3: Donor Details';

  const captureLocation = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      setError('Location permission is required to enable nearby matching.');
      return;
    }

    const currentPosition = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    setCoordinates({
      latitude: currentPosition.coords.latitude,
      longitude: currentPosition.coords.longitude,
    });
    setError(null);
  };

  const validateStep1 = () => {
    const fullName = (hasPrefilledName ? prefilledBasicInfo.fullName : basicInfo.fullName).trim();
    const phone = (hasPrefilledPhone ? prefilledBasicInfo.phone : basicInfo.phone).trim();
    const email = (hasPrefilledEmail ? prefilledBasicInfo.email : basicInfo.email).trim();

    if (fullName.length < 2) {
      setError('Full name is required.');
      return false;
    }

    if (!email.includes('@')) {
      setError('A valid email address is required.');
      return false;
    }

    if (phone.length < 10) {
      setError('A valid phone number is required.');
      return false;
    }

    setBasicInfo({ email, fullName, phone });
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!role) {
      setError('Choose the account type that best describes you.');
      return false;
    }

    setError(null);
    return true;
  };

  const validateStep3 = () => {
    if (role === 'donor') {
      if (!donorDetails.bloodType) {
        setError('Select your blood type.');
        return false;
      }

      const weightKg = Number(donorDetails.weightKg);
      const issues = getDonorEligibilityIssues({
        birthdate: donorDetails.birthdate,
        lastTransfusionDate: donorDetails.lastTransfusionDate || null,
        weightKg: Number.isFinite(weightKg) ? weightKg : null,
      });

      if (issues.length) {
        setError(issues[0]);
        return false;
      }
    }

    if (role === 'recipient' && !recipientDetails.bloodType) {
      setError('Select your blood type.');
      return false;
    }

    if (role === 'bloodbank') {
      if (!bloodbankDetails.position.trim()) {
        setError('Position or role is required.');
        return false;
      }

      if (!bloodbankDetails.employeeId.trim()) {
        setError('Employee or staff ID is required.');
        return false;
      }

      if (!bloodbankDetails.hospitalName.trim()) {
        setError('Hospital or blood bank name is required.');
        return false;
      }

      if (!bloodbankDetails.branchLocation.trim()) {
        setError('Branch or location is required.');
        return false;
      }

      if (!bloodbankDetails.workEmail.includes('@')) {
        setError('A valid work email address is required.');
        return false;
      }

      if (bloodbankDetails.workPhone.trim().length < 10) {
        setError('A valid work phone number is required.');
        return false;
      }

      if (!bloodbankDetails.documents.length) {
        setError('Upload at least one proof of affiliation document.');
        return false;
      }
    }

    setError(null);
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) {
      return;
    }

    if (step === 2 && !validateStep2()) {
      return;
    }

    if (step < 3) {
      setStep((current) => (current === 1 ? 2 : 3));
      return;
    }

    void submitProfile();
  };

  const submitProfile = async () => {
    if (loading || !session?.user.id || !role || !validateStep3()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullName = (hasPrefilledName ? prefilledBasicInfo.fullName : basicInfo.fullName).trim();
      const phone = (hasPrefilledPhone ? prefilledBasicInfo.phone : basicInfo.phone).trim();

      if (role === 'bloodbank') {
        const { error: verificationError } = await submitBloodbankVerification({
          branchLocation: bloodbankDetails.branchLocation,
          documents: bloodbankDetails.documents,
          employeeId: bloodbankDetails.employeeId,
          fullName,
          hospitalName: bloodbankDetails.hospitalName,
          phone,
          position: bloodbankDetails.position,
          userId: session.user.id,
          workEmail: bloodbankDetails.workEmail,
          workPhone: bloodbankDetails.workPhone,
        });

        if (verificationError) {
          setError(verificationError.message);
          return;
        }
      } else {
        const enableLocation =
          role === 'donor' ? donorDetails.enableLocation : recipientDetails.enableLocation;

        if (enableLocation && (coordinates.latitude === null || coordinates.longitude === null)) {
          await captureLocation();
        }

        const weightKg = Number(donorDetails.weightKg);
        const { error: profileError } = await completeProfile({
          bloodType: role === 'donor' ? donorDetails.bloodType : recipientDetails.bloodType,
          birthdate: role === 'donor' ? donorDetails.birthdate : null,
          fullName,
          isAvailable: role === 'donor' ? donorDetails.availableToDonate : false,
          lastDonationAt: donorDetails.lastDonationDate || null,
          latitude: enableLocation ? coordinates.latitude : null,
          longitude: enableLocation ? coordinates.longitude : null,
          phone,
          role,
          userId: session.user.id,
          weightKg: role === 'donor' && Number.isFinite(weightKg) ? weightKg : null,
        });

        if (profileError) {
          setError(profileError.message);
          return;
        }
      }

      await refreshProfile();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Unable to complete your profile.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderBloodTypeGrid = (
    selectedBloodType: BloodType | null,
    onSelect: (bloodType: BloodType) => void,
  ) => (
    <View style={profileSetupStyles.section}>
      <Text style={profileSetupStyles.sectionTitle}>Blood Type</Text>
      <View style={profileSetupStyles.bloodGrid}>
        {BLOOD_TYPES.map((bloodType) => {
          const selected = selectedBloodType === bloodType;

          return (
            <Pressable
              key={bloodType}
              style={[
                profileSetupStyles.bloodTypeButton,
                selected ? profileSetupStyles.bloodTypeButtonSelected : null,
              ]}
              onPress={() => onSelect(bloodType)}
            >
              <Text
                style={[
                  profileSetupStyles.bloodTypeText,
                  selected ? profileSetupStyles.bloodTypeTextSelected : null,
                ]}
              >
                {bloodType}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={profileSetupStyles.section}>
      <View style={profileSetupStyles.photoCircle}>
        <Camera color="#9ca3af" size={32} />
      </View>
      <Pressable style={profileSetupStyles.uploadButton}>
        <Text style={profileSetupStyles.uploadButtonText}>Upload Photo</Text>
      </Pressable>
      {hasPrefilledName ? (
        <View style={profileSetupStyles.readOnlyField}>
          <Text style={profileSetupStyles.readOnlyLabel}>Full Name</Text>
          <Text style={profileSetupStyles.readOnlyValue}>{prefilledBasicInfo.fullName}</Text>
        </View>
      ) : (
        <FormTextInput
          label="Full Name"
          placeholder="John Doe"
          value={basicInfo.fullName}
          onChangeText={(fullName) => setBasicInfo((current) => ({ ...current, fullName }))}
        />
      )}
      {hasPrefilledEmail ? (
        <View style={profileSetupStyles.readOnlyField}>
          <Text style={profileSetupStyles.readOnlyLabel}>Email</Text>
          <Text style={profileSetupStyles.readOnlyValue}>{prefilledBasicInfo.email}</Text>
        </View>
      ) : (
        <FormTextInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          placeholder="john@example.com"
          value={basicInfo.email}
          onChangeText={(email) => setBasicInfo((current) => ({ ...current, email }))}
        />
      )}
      {hasPrefilledPhone ? (
        <View style={profileSetupStyles.readOnlyField}>
          <Text style={profileSetupStyles.readOnlyLabel}>Phone Number</Text>
          <Text style={profileSetupStyles.readOnlyValue}>{prefilledBasicInfo.phone}</Text>
        </View>
      ) : (
        <FormTextInput
          keyboardType="phone-pad"
          label="Phone Number"
          placeholder="+1 (555) 123-4567"
          value={basicInfo.phone}
          onChangeText={(phone) => setBasicInfo((current) => ({ ...current, phone }))}
        />
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={profileSetupStyles.roleList}>
      <RoleSelectionCard
        description="I want to donate blood"
        icon={<Heart color={colors.primary} size={22} />}
        iconBackground={colors.primarySoft}
        selected={role === 'donor'}
        title="Donor"
        onPress={() => setRole('donor')}
      />
      <RoleSelectionCard
        description="I need blood donation"
        icon={<Users color={colors.info} size={22} />}
        iconBackground={colors.infoSoft}
        selected={role === 'recipient'}
        title="Recipient"
        onPress={() => setRole('recipient')}
      />
      <RoleSelectionCard
        description="I work at a blood bank"
        icon={<Building2 color={colors.success} size={22} />}
        iconBackground={colors.successSoft}
        selected={role === 'bloodbank'}
        title="Blood Bank Personnel"
        onPress={() => setRole('bloodbank')}
      />
    </View>
  );

  const renderDonorStep3 = () => (
    <>
      {renderBloodTypeGrid(donorDetails.bloodType, (bloodType) =>
        setDonorDetails((current) => ({ ...current, bloodType })),
      )}
      <ToggleSettingCard
        description="Allow BloodLink to find nearby blood requests."
        icon={<MapPin color={colors.primary} size={20} />}
        title="Enable Location"
        value={donorDetails.enableLocation}
        onValueChange={(enableLocation) => {
          setDonorDetails((current) => ({ ...current, enableLocation }));
          if (enableLocation) {
            void captureLocation();
          }
        }}
      />
      <ToggleSettingCard
        description="Show me in search results for recipients."
        title="Available to Donate"
        value={donorDetails.availableToDonate}
        onValueChange={(availableToDonate) =>
          setDonorDetails((current) => ({ ...current, availableToDonate }))
        }
      />
      <FormTextInput
        keyboardType="numbers-and-punctuation"
        label="Birthdate"
        placeholder="YYYY-MM-DD"
        value={donorDetails.birthdate}
        onChangeText={(birthdate) => setDonorDetails((current) => ({ ...current, birthdate }))}
      />
      <FormTextInput
        keyboardType="decimal-pad"
        label="Weight (kg)"
        placeholder="50"
        value={donorDetails.weightKg}
        onChangeText={(weightKg) => setDonorDetails((current) => ({ ...current, weightKg }))}
      />
      <FormTextInput
        keyboardType="numbers-and-punctuation"
        label="Last Donation Date (Optional)"
        placeholder="YYYY-MM-DD"
        value={donorDetails.lastDonationDate}
        onChangeText={(lastDonationDate) =>
          setDonorDetails((current) => ({ ...current, lastDonationDate }))
        }
      />
      <FormTextInput
        keyboardType="numbers-and-punctuation"
        label="Last Blood Transfusion Date (if applicable)"
        placeholder="YYYY-MM-DD"
        value={donorDetails.lastTransfusionDate}
        onChangeText={(lastTransfusionDate) =>
          setDonorDetails((current) => ({ ...current, lastTransfusionDate }))
        }
      />
      <EligibilityCallout />
    </>
  );

  const renderRecipientStep3 = () => (
    <>
      {renderBloodTypeGrid(recipientDetails.bloodType, (bloodType) =>
        setRecipientDetails((current) => ({ ...current, bloodType })),
      )}
      <ToggleSettingCard
        description="Allow BloodLink to find nearby donors."
        icon={<MapPin color={colors.primary} size={20} />}
        title="Enable Location"
        value={recipientDetails.enableLocation}
        onValueChange={(enableLocation) => {
          setRecipientDetails((current) => ({ ...current, enableLocation }));
          if (enableLocation) {
            void captureLocation();
          }
        }}
      />
      <View style={profileSetupStyles.infoCallout}>
        <Text style={profileSetupStyles.infoCalloutTitle}>Important Information</Text>
        <Text style={profileSetupStyles.infoCalloutText}>
          Your blood type information will help us match you with compatible donors quickly in case
          of emergency.
        </Text>
      </View>
    </>
  );

  const renderBloodbankStep3 = () => (
    <>
      <View style={profileSetupStyles.section}>
        <Text style={profileSetupStyles.sectionTitle}>Basic work information</Text>
        {hasPrefilledName ? (
          <View style={profileSetupStyles.readOnlyField}>
            <Text style={profileSetupStyles.readOnlyLabel}>Full Name</Text>
            <Text style={profileSetupStyles.readOnlyValue}>
              {hasPrefilledName ? prefilledBasicInfo.fullName : basicInfo.fullName}
            </Text>
          </View>
        ) : null}
        <FormTextInput
          label="Position / Role"
          placeholder="Blood Bank Staff, Medical Technologist, Nurse"
          value={bloodbankDetails.position}
          onChangeText={(position) =>
            setBloodbankDetails((current) => ({ ...current, position }))
          }
        />
        <FormTextInput
          label="Employee / Staff ID"
          placeholder="Employee ID number"
          value={bloodbankDetails.employeeId}
          onChangeText={(employeeId) =>
            setBloodbankDetails((current) => ({ ...current, employeeId }))
          }
        />
        <FormTextInput
          label="Hospital / Blood Bank Name"
          placeholder="Hospital or blood bank name"
          value={bloodbankDetails.hospitalName}
          onChangeText={(hospitalName) =>
            setBloodbankDetails((current) => ({ ...current, hospitalName }))
          }
        />
        <FormTextInput
          label="Branch / Location"
          placeholder="Branch or site location"
          value={bloodbankDetails.branchLocation}
          onChangeText={(branchLocation) =>
            setBloodbankDetails((current) => ({ ...current, branchLocation }))
          }
        />
      </View>
      <View style={profileSetupStyles.section}>
        <Text style={profileSetupStyles.sectionTitle}>Contact information</Text>
        <FormTextInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Work Email Address"
          placeholder="name@hospital.gov"
          value={bloodbankDetails.workEmail}
          onChangeText={(workEmail) =>
            setBloodbankDetails((current) => ({ ...current, workEmail }))
          }
        />
        <FormTextInput
          keyboardType="phone-pad"
          label="Phone Number"
          placeholder="Work phone number"
          value={bloodbankDetails.workPhone}
          onChangeText={(workPhone) =>
            setBloodbankDetails((current) => ({ ...current, workPhone }))
          }
        />
      </View>
      <DocumentPickerField
        documents={bloodbankDetails.documents}
        error={error && !bloodbankDetails.documents.length ? error : null}
        onChange={(documents) => setBloodbankDetails((current) => ({ ...current, documents }))}
      />
      <View style={profileSetupStyles.infoCallout}>
        <Text style={profileSetupStyles.infoCalloutTitle}>Verification status</Text>
        <Text style={profileSetupStyles.infoCalloutText}>
          After submission, your Blood Bank Personnel account will be under review. BloodLink
          administrators will verify your submitted information before granting access to blood bank
          features.
        </Text>
      </View>
    </>
  );

  const renderStep3 = () => {
    if (role === 'donor') {
      return renderDonorStep3();
    }

    if (role === 'recipient') {
      return renderRecipientStep3();
    }

    if (role === 'bloodbank') {
      return renderBloodbankStep3();
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      style={profileSetupStyles.screen}
    >
      <ScrollView
        contentContainerStyle={profileSetupStyles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AuthBrand />
        <ProfileSetupProgress currentStep={step} />
        <View style={profileSetupStyles.heading}>
          <Text style={profileSetupStyles.stepTitle}>{stepTitle}</Text>
          <Text style={profileSetupStyles.stepSubtitle}>{stepSubtitle}</Text>
        </View>
        {step === 1 ? renderStep1() : null}
        {step === 2 ? renderStep2() : null}
        {step === 3 ? renderStep3() : null}
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        <PrimaryButton
          loading={loading}
          title={step === 3 ? 'Complete Profile' : 'Continue'}
          onPress={goNext}
          style={profileSetupStyles.continueButton}
        />
        {step > 1 ? (
          <PrimaryButton
            title="Back"
            variant="secondary"
            onPress={() => {
              setError(null);
              setStep((current) => (current === 3 ? 2 : 1));
            }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
