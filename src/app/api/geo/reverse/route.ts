import { NextResponse } from 'next/server';

const reverseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 600 * 1000; // 10 minutes

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latStr = searchParams.get('latitude') || searchParams.get('lat');
  const lonStr = searchParams.get('longitude') || searchParams.get('lon');

  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: 'latitude and longitude are required query parameters' },
      { status: 400 }
    );
  }

  const latitude = parseFloat(latStr);
  const longitude = parseFloat(lonStr);

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid latitude or longitude numbers' },
      { status: 400 }
    );
  }

  // Cache key rounded to ~100 meters
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = reverseCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AapdaSetu-CrisisEngine/2.0 (contact@aapdasetu.org)',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const locality =
        address.suburb ||
        address.neighbourhood ||
        address.village ||
        address.town ||
        address.city_district ||
        address.city ||
        'Local Sector';

      const district =
        address.state_district ||
        address.county ||
        address.district ||
        locality;

      const parentCity =
        address.city ||
        address.town ||
        address.municipality ||
        address.state_district ||
        address.county ||
        address.district ||
        locality;

      const state = address.state || 'State';
      const country = address.country || 'Country';

      const payload = {
        display_name: data.display_name || `${locality}, ${parentCity}, ${state}`,
        locality,
        district,
        city: parentCity,
        parent_city: parentCity,
        state,
        country,
        latitude,
        longitude,
      };

      reverseCache.set(cacheKey, { data: payload, timestamp: now });
      return NextResponse.json(payload);
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode error:', err);
  }

  // Resilient deterministic fallback
  const fallback = {
    display_name: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
    locality: 'Active Sector',
    district: 'Local District',
    city: 'Active Sector',
    parent_city: 'Active Sector',
    state: 'State',
    country: 'India',
    latitude,
    longitude,
  };

  return NextResponse.json(fallback);
}
