import { Text, View } from 'react-native';

import { mapStyles } from '@/components/map/styles';
import { URGENCY_LABELS } from '@/constants/bloodRequestUrgency';
import type { OpenBloodRequestFeedItem } from '@/services/supabase/openBloodRequestsFeed';
import { formatApproximateCoordinates } from '@/utils/coordinates';

type BloodRequestMapMarkerContentProps = {
  request: Pick<
    OpenBloodRequestFeedItem,
    'blood_type' | 'units_needed' | 'urgency' | 'latitude' | 'longitude'
  >;
  distanceLabel?: string | null;
  travelTimeLabel?: string | null;
};

export function BloodRequestMapMarkerContent({
  request,
  distanceLabel,
  travelTimeLabel,
}: BloodRequestMapMarkerContentProps) {
  return (
    <View style={mapStyles.calloutCard}>
      <Text style={mapStyles.calloutTitle}>
        {request.blood_type} · {request.units_needed} unit
        {request.units_needed === 1 ? '' : 's'}
      </Text>
      <Text style={mapStyles.calloutMeta}>{URGENCY_LABELS[request.urgency]}</Text>
      <Text style={mapStyles.calloutMeta}>
        {formatApproximateCoordinates(request.latitude, request.longitude)}
      </Text>
      {distanceLabel ? <Text style={mapStyles.calloutMeta}>{distanceLabel}</Text> : null}
      {travelTimeLabel ? <Text style={mapStyles.calloutMeta}>{travelTimeLabel}</Text> : null}
    </View>
  );
}
