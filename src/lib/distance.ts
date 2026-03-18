import { LatLng } from '@/types/activity';

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceInMeters(start: LatLng, end: LatLng): number {
  const R = 6371000;

  const dLat = toRad(end.latitude - start.latitude);
  const dLon = toRad(end.longitude - start.longitude);

  const lat1 = toRad(start.latitude);
  const lat2 = toRad(end.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function getTotalDistance(coords: LatLng[]): number {
  if (coords.length < 2) return 0;

  let total = 0;

  for (let i = 1; i < coords.length; i++) {
    total += getDistanceInMeters(coords[i - 1], coords[i]);
  }

  return total;
}