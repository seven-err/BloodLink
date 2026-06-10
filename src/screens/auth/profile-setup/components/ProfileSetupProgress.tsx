import { View } from 'react-native';

import { profileSetupStyles } from '../styles';

type ProfileSetupProgressProps = {
  currentStep: 1 | 2 | 3;
  totalSteps?: number;
};

export function ProfileSetupProgress({
  currentStep,
  totalSteps = 3,
}: ProfileSetupProgressProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={profileSetupStyles.progressTrack}>
      <View
        style={[
          profileSetupStyles.progressSegment,
          { width: `${progressPercentage}%` },
        ]}
      />
    </View>
  );
}
