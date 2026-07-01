import { Text, View } from 'react-native';

import { DONOR_ELIGIBILITY_REQUIREMENTS } from '@/utils/donorEligibility';
import { profileSetupStyles } from '../styles';

export function EligibilityCallout() {
  return (
    <View style={profileSetupStyles.callout}>
      <Text style={profileSetupStyles.calloutTitle}>Eligibility Requirements</Text>
      {DONOR_ELIGIBILITY_REQUIREMENTS.map((requirement) => (
        <Text key={requirement} style={profileSetupStyles.calloutItem}>
          • {requirement}
        </Text>
      ))}
    </View>
  );
}
