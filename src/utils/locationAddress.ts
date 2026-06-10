import type * as Location from 'expo-location';

export const formatGeocodedAddress = (place: Location.LocationGeocodedAddress) => {
  const parts = [place.name, place.street, place.district, place.city, place.region, place.postalCode]
    .map((part) => part?.trim())
    .filter((part, index, array): part is string => Boolean(part && array.indexOf(part) === index));

  return parts.join(', ');
};
