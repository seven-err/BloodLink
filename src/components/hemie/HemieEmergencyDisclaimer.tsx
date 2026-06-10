import { Info, X } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { hemieStyles } from '@/screens/hemie/styles';

type HemieEmergencyDisclaimerProps = {
  onDismiss: () => void;
};

export const HEMIE_EMERGENCY_DISCLAIMER_TEXT =
  'For medical emergencies, contact healthcare personnel immediately at 911.';

export function HemieEmergencyDisclaimer({ onDismiss }: HemieEmergencyDisclaimerProps) {
  return (
    <View style={hemieStyles.disclaimer}>
      <View style={hemieStyles.disclaimerRow}>
        <Info color={colors.primary} size={18} />
        <Text style={hemieStyles.disclaimerText}>
          <Text style={hemieStyles.disclaimerLabel}>Emergency disclaimer: </Text>
          {HEMIE_EMERGENCY_DISCLAIMER_TEXT}
        </Text>
        <Pressable
          accessibilityLabel="Hide emergency disclaimer"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onDismiss}
        >
          <X color={colors.muted} size={18} />
        </Pressable>
      </View>
    </View>
  );
}
