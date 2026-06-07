export const formatDistance = (meters: number | null | undefined): string => {
  if (meters == null || !Number.isFinite(meters)) {
    return 'Distance unavailable';
  }

  if (meters < 1000) {
    return `~${Math.round(meters)} m away`;
  }

  return `~${(meters / 1000).toFixed(1)} km away`;
};

export const formatTravelTime = (seconds: number | null | undefined): string | null => {
  if (seconds == null || !Number.isFinite(seconds)) {
    return null;
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  return `~${minutes} min travel time`;
};
