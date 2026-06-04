export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodingResult = {
  displayName: string;
  coordinates: Coordinates;
  boundingBox?: string[];
  raw: unknown;
};

export type RouteResult = {
  distanceMeters: number;
  durationSeconds: number;
  geometry?: string;
  raw: unknown;
};
