const R_MILES = 3958.8;
const rad = (d: number) => (d * Math.PI) / 180;

export interface Point {
  lat: number;
  lon: number;
}

/** Great-circle distance in miles (Haversine). */
export function distanceMiles(a: Point, b: Point): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a to b in degrees, 0 = north, clockwise. */
export function bearingDegrees(a: Point, b: Point): number {
  const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
export type Compass = (typeof COMPASS)[number];

/** Snaps a bearing to one of 8 compass directions. */
export function compass(bearing: number): Compass {
  return COMPASS[Math.round(bearing / 45) % 8];
}
