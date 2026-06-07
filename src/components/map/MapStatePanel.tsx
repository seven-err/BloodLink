import { ActivityIndicator, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { mapStyles } from '@/components/map/styles';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';

type MapStatePanelProps = {
  variant?: 'overlay' | 'inline';
  title: string;
  message: string;
  loading?: boolean;
  error?: boolean;
  primaryAction?: {
    title: string;
    onPress: () => void;
  };
  secondaryAction?: {
    title: string;
    onPress: () => void;
  };
};

export function MapStatePanel({
  variant = 'overlay',
  title,
  message,
  loading = false,
  error = false,
  primaryAction,
  secondaryAction,
}: MapStatePanelProps) {
  const containerStyle = variant === 'overlay' ? mapStyles.overlay : recipientStyles.card;

  return (
    <View style={containerStyle}>
      {loading ? <ActivityIndicator color="#b91c1c" size="large" /> : null}
      <Text style={mapStyles.overlayTitle}>{title}</Text>
      <Text style={error ? authStyles.error : recipientStyles.subtitle}>{message}</Text>
      {primaryAction ? (
        <PrimaryButton title={primaryAction.title} onPress={primaryAction.onPress} />
      ) : null}
      {secondaryAction ? (
        <PrimaryButton
          title={secondaryAction.title}
          variant="secondary"
          onPress={secondaryAction.onPress}
        />
      ) : null}
    </View>
  );
}
