export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Activity = {
  id: string;
  createdAt: string;
  durationSec: number;
  distanceMeters: number;
  coordinates: LatLng[];
};