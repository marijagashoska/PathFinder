export const MAPTILER_KEY = 'ehzsDDNTJ1G7HaRwtCmL';

export const HAS_MAPTILER_KEY =
  MAPTILER_KEY.trim().length > 0 &&
  MAPTILER_KEY.trim() !== 'PASTE_YOUR_REAL_KEY_HERE';

export const MAPTILER_TILE_URL = HAS_MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : '';

export const MAPTILER_ATTRIBUTION_URL = 'https://www.maptiler.com/copyright/';