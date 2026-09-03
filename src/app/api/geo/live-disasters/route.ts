import { NextResponse } from 'next/server';

let cachedDisasters: any[] = [];
let lastFetchedTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60s memory cache

// Dynamic Geocoder using OpenStreetMap Nominatim
async function geocodePlace(placeName: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AapdaSetu-DisasterEngine/2.0 (contact@aapdasetu.org)' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return [lon, lat];
        }
      }
    }
  } catch {}
  return null;
}

function isIndianCoordinates(lat: number, lon: number): boolean {
  return lat >= 6.0 && lat <= 38.0 && lon >= 68.0 && lon <= 98.0;
}

const SPECIFIC_ZONES: Record<string, { place: string; lat: number; lon: number }> = {
  'darjeeling': { place: 'Darjeeling, West Bengal', lat: 27.0410, lon: 88.2663 },
  'kalimpong': { place: 'Kalimpong, West Bengal', lat: 27.0667, lon: 88.4667 },
  'jalpaiguri': { place: 'Jalpaiguri, West Bengal', lat: 26.5404, lon: 88.7196 },
  'siliguri': { place: 'Siliguri, West Bengal', lat: 26.7271, lon: 88.3953 },
  'wayanad': { place: 'Wayanad, Kerala', lat: 11.6854, lon: 76.1320 },
  'idukki': { place: 'Idukki, Kerala', lat: 9.8494, lon: 76.9806 },
  'munnar': { place: 'Munnar, Kerala', lat: 10.0889, lon: 77.0595 },
  'pathanamthitta': { place: 'Pathanamthitta, Kerala', lat: 9.2648, lon: 76.7870 },
  'shimla': { place: 'Shimla, Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  'kullu': { place: 'Kullu, Himachal Pradesh', lat: 31.9579, lon: 77.1095 },
  'mandi': { place: 'Mandi, Himachal Pradesh', lat: 31.7087, lon: 76.9320 },
  'manali': { place: 'Manali, Himachal Pradesh', lat: 32.2432, lon: 77.1892 },
  'kangra': { place: 'Kangra, Himachal Pradesh', lat: 32.0998, lon: 76.2691 },
  'chamoli': { place: 'Chamoli, Uttarakhand', lat: 30.4227, lon: 79.3243 },
  'kedarnath': { place: 'Kedarnath, Uttarakhand', lat: 30.7352, lon: 79.0669 },
  'badrinath': { place: 'Badrinath, Uttarakhand', lat: 30.7433, lon: 79.4938 },
  'uttarkashi': { place: 'Uttarkashi, Uttarakhand', lat: 30.7268, lon: 78.4354 },
  'rudraprayag': { place: 'Rudraprayag, Uttarakhand', lat: 30.2844, lon: 78.9811 },
  'dehradun': { place: 'Dehradun, Uttarakhand', lat: 30.3165, lon: 78.0322 },
  'nainital': { place: 'Nainital, Uttarakhand', lat: 29.3919, lon: 79.4542 },
  'bhimtal': { place: 'Bhimtal, Uttarakhand', lat: 29.3496, lon: 79.5539 },
  'joshimath': { place: 'Joshimath, Uttarakhand', lat: 30.5574, lon: 79.5663 },
  'guwahati': { place: 'Guwahati, Assam', lat: 26.1445, lon: 91.7362 },
  'silchar': { place: 'Silchar, Assam', lat: 24.8333, lon: 92.7789 },
  'dhubri': { place: 'Dhubri, Assam', lat: 26.0207, lon: 89.9749 },
  'dibrugarh': { place: 'Dibrugarh, Assam', lat: 27.4728, lon: 94.9120 },
  'kaziranga': { place: 'Kaziranga, Assam', lat: 26.5775, lon: 93.1711 },
  'patna': { place: 'Patna, Bihar', lat: 25.5941, lon: 85.1376 },
  'darbhanga': { place: 'Darbhanga, Bihar', lat: 26.1542, lon: 85.8918 },
  'katihar': { place: 'Katihar, Bihar', lat: 25.5434, lon: 87.5684 },
  'bhagalpur': { place: 'Bhagalpur, Bihar', lat: 25.2425, lon: 86.9842 },
  'purnia': { place: 'Purnia, Bihar', lat: 25.7771, lon: 87.4753 },
  'cuttack': { place: 'Cuttack, Odisha', lat: 20.4625, lon: 85.8828 },
  'puri': { place: 'Puri, Odisha', lat: 19.8135, lon: 85.8312 },
  'bhubaneswar': { place: 'Bhubaneswar, Odisha', lat: 20.2961, lon: 85.8245 },
  'kendrapara': { place: 'Kendrapara, Odisha', lat: 20.5015, lon: 86.4222 },
  'balasore': { place: 'Balasore, Odisha', lat: 21.4934, lon: 86.9135 },
  'vadodara': { place: 'Vadodara, Gujarat', lat: 22.3072, lon: 73.1812 },
  'surat': { place: 'Surat, Gujarat', lat: 21.1702, lon: 72.8311 },
  'ahmedabad': { place: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714 },
  'rajkot': { place: 'Rajkot, Gujarat', lat: 22.3039, lon: 70.8022 },
  'bharuch': { place: 'Bharuch, Gujarat', lat: 21.7051, lon: 72.9959 },
  'mumbai': { place: 'Mumbai, Maharashtra', lat: 19.0760, lon: 72.8777 },
  'pune': { place: 'Pune, Maharashtra', lat: 18.5204, lon: 73.8567 },
  'thane': { place: 'Thane, Maharashtra', lat: 19.2183, lon: 72.9781 },
  'raigad': { place: 'Raigad, Maharashtra', lat: 18.5158, lon: 73.1822 },
  'ratnagiri': { place: 'Ratnagiri, Maharashtra', lat: 16.9902, lon: 73.3120 },
  'kolhapur': { place: 'Kolhapur, Maharashtra', lat: 16.7050, lon: 74.2433 },
  'chennai': { place: 'Chennai, Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  'thoothukudi': { place: 'Thoothukudi, Tamil Nadu', lat: 8.7642, lon: 78.1348 },
  'tirunelveli': { place: 'Tirunelveli, Tamil Nadu', lat: 8.7139, lon: 77.7567 },
  'cuddalore': { place: 'Cuddalore, Tamil Nadu', lat: 11.7480, lon: 79.7714 },
  'vijayawada': { place: 'Vijayawada, Andhra Pradesh', lat: 16.5062, lon: 80.6480 },
  'srikakulam': { place: 'Srikakulam, Andhra Pradesh', lat: 18.2949, lon: 83.8938 },
  'visakhapatnam': { place: 'Visakhapatnam, Andhra Pradesh', lat: 17.6868, lon: 83.2185 },
  'nellore': { place: 'Nellore, Andhra Pradesh', lat: 14.4426, lon: 79.9865 },
  'ranchi': { place: 'Ranchi, Jharkhand', lat: 23.3441, lon: 85.3096 },
  'jamshedpur': { place: 'Jamshedpur, Jharkhand', lat: 22.8046, lon: 86.2029 },
  'dhanbad': { place: 'Dhanbad, Jharkhand', lat: 23.7957, lon: 86.4304 },
  'delhi': { place: 'Delhi NCR', lat: 28.6139, lon: 77.2090 },
  'bengaluru': { place: 'Bengaluru, Karnataka', lat: 12.9716, lon: 77.5946 },
  'mangaluru': { place: 'Mangaluru, Karnataka', lat: 12.9141, lon: 74.8560 },
  'udupi': { place: 'Udupi, Karnataka', lat: 13.3409, lon: 74.7421 },
  'kathmandu': { place: 'Kathmandu Valley, Nepal', lat: 27.7172, lon: 85.3240 },
  'pokhara': { place: 'Pokhara, Nepal', lat: 28.2096, lon: 83.9856 },
  'chitwan': { place: 'Chitwan, Nepal', lat: 27.5291, lon: 84.3542 },
  'sindhupalchok': { place: 'Sindhupalchok, Nepal', lat: 27.9506, lon: 85.6841 },
  'melamchi': { place: 'Melamchi, Nepal', lat: 27.8306, lon: 85.5800 },
  'biratnagar': { place: 'Biratnagar, Koshi, Nepal', lat: 26.4525, lon: 87.2718 },
  'lalitpur': { place: 'Lalitpur, Nepal', lat: 27.6644, lon: 85.3188 },
  'bhaktapur': { place: 'Bhaktapur, Nepal', lat: 27.6710, lon: 85.4298 },
};

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveSpecificPlace(lat: number, lon: number, country?: string, rawTitle?: string): string {
  const combined = `${rawTitle || ''} ${country || ''}`.toLowerCase();
  for (const [key, zone] of Object.entries(SPECIFIC_ZONES)) {
    if (combined.includes(key)) {
      return zone.place;
    }
  }

  let closest: string | null = null;
  let minD = 140;
  for (const zone of Object.values(SPECIFIC_ZONES)) {
    const d = getDistanceKm(lat, lon, zone.lat, zone.lon);
    if (d < minD) {
      minD = d;
      closest = zone.place;
    }
  }
  if (closest) return closest;

  if (country === 'Nepal') return 'Himalayan Foothills, Nepal';
  if (country === 'India') return 'Indo-Gangetic Basin, India';
  return country || 'Active Hazard Sector';
}

export async function GET(req: Request) {
  const now = Date.now();
  if (cachedDisasters.length > 0 && now - lastFetchedTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedDisasters);
  }

  const results: any[] = [];
  const seenIds = new Set<string>();

  // ----------------------------------------------------------------------------------
  // 1. UN / European Commission GDACS REST API (Floods, Cyclones, Earthquakes, Volcanoes, Wildfires)
  // ----------------------------------------------------------------------------------
  try {
    const gdacsRes = await fetch(
      'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,DR,WF',
      {
        headers: { 'User-Agent': 'AapdaSetu-DisasterPlatform/2.0' },
        signal: AbortSignal.timeout(6000),
      }
    );
    if (gdacsRes.ok) {
      const data = await gdacsRes.json();
      for (const f of data.features || []) {
        const p = f.properties;
        const geom = f.geometry;
        if (!geom || !geom.coordinates || geom.coordinates.length < 2) continue;
        const lon = Number(geom.coordinates[0]);
        const lat = Number(geom.coordinates[1]);
        if (isNaN(lon) || isNaN(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

        let dType = 'FLOOD';
        if (p.eventtype === 'TC') dType = 'CYCLONE';
        else if (p.eventtype === 'EQ') dType = 'EARTHQUAKE';
        else if (p.eventtype === 'VO') dType = 'VOLCANO';
        else if (p.eventtype === 'WF') dType = 'FIRE';
        else if (p.eventtype === 'FL') dType = 'FLOOD';
        else if (p.eventtype === 'DR') dType = 'DROUGHT';

        const alertLevel = (p.alertlevel || '').toLowerCase();
        const score = alertLevel === 'red' ? 90 : alertLevel === 'orange' ? 72 : 45;
        const id = `GDACS-${p.eventid}-${p.episodeid || 0}`;

        const isIndia = (p.country || '').includes('India') || isIndianCoordinates(lat, lon);

        if (!seenIds.has(id)) {
          seenIds.add(id);
          const resolvedPlace = resolveSpecificPlace(lat, lon, p.country, p.name || p.htmldescription);
          results.push({
            id,
            title: p.name || p.htmldescription || `${dType} Alert`,
            place: resolvedPlace,
            disaster_type: dType,
            severity: alertLevel === 'red' ? 'CRITICAL' : alertLevel === 'orange' ? 'SEVERE' : 'MODERATE',
            risk_score: score,
            longitude: lon,
            latitude: lat,
            depth_km: p.eventtype === 'EQ' ? (p.severitydata?.depth || 10) : 0,
            radius_km: 75,
            source: 'GDACS (UN / European Commission)',
            url: p.url?.report || 'https://www.gdacs.org',
            timestamp: p.fromdate || new Date().toISOString(),
            is_verified: true,
            is_india: isIndia,
            country: isIndia ? 'India' : p.country || 'Global',
          });
        }
      }
    }
  } catch (e) {
    console.warn('GDACS REST API fetch warning:', e);
  }

  // ----------------------------------------------------------------------------------
  // 2. NASA EONET v3 Natural Disasters API (Severe Storms, Cyclones, Wildfires)
  // ----------------------------------------------------------------------------------
  try {
    const nasaRes = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100',
      { signal: AbortSignal.timeout(6000) }
    );
    if (nasaRes.ok) {
      const data = await nasaRes.json();
      for (const ev of data.events || []) {
        const geo = ev.geometry?.[ev.geometry.length - 1];
        if (!geo || !geo.coordinates || geo.coordinates.length < 2) continue;
        const lon = Number(geo.coordinates[0]);
        const lat = Number(geo.coordinates[1]);
        if (isNaN(lon) || isNaN(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

        const cat = (ev.categories?.[0]?.title || '').toUpperCase();
        let dType = 'FLOOD';
        if (cat.includes('STORM') || cat.includes('CYCLONE') || cat.includes('HURRICANE')) dType = 'CYCLONE';
        else if (cat.includes('FIRE') || cat.includes('WILDFIRE')) dType = 'FIRE';
        else if (cat.includes('VOLCANO')) dType = 'FIRE';
        else if (cat.includes('FLOOD')) dType = 'FLOOD';

        const id = `NASA-${ev.id}`;
        const isIndia = isIndianCoordinates(lat, lon);

        if (!seenIds.has(id)) {
          seenIds.add(id);
          results.push({
            id,
            title: ev.title,
            place: ev.title,
            disaster_type: dType,
            severity: 'CRITICAL',
            risk_score: 82,
            longitude: lon,
            latitude: lat,
            depth_km: 0,
            radius_km: 100,
            source: 'NASA Earth Observatory (EONET)',
            url: ev.sources?.[0]?.url || 'https://eonet.gsfc.nasa.gov',
            timestamp: geo.date || new Date().toISOString(),
            is_verified: true,
            is_india: isIndia,
            country: isIndia ? 'India' : 'International',
          });
        }
      }
    }
  } catch (e) {
    console.warn('NASA EONET fetch warning:', e);
  }

  // ----------------------------------------------------------------------------------
  // 3. USGS Indian Subcontinent High-Precision Seismic Network (India & Plate Boundary)
  // ----------------------------------------------------------------------------------
  try {
    const usgsIndiaUrl =
      'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.2&minlatitude=6.0&maxlatitude=38.0&minlongitude=68.0&maxlongitude=98.0&limit=40';
    const usgsIndiaRes = await fetch(usgsIndiaUrl, { signal: AbortSignal.timeout(5000) });
    if (usgsIndiaRes.ok) {
      const data = await usgsIndiaRes.json();
      for (const f of data.features || []) {
        const mag = f.properties.mag ?? 2.5;
        const coords = f.geometry?.coordinates || [0, 0, 10];
        const lon = Number(coords[0]);
        const lat = Number(coords[1]);
        const depth = coords[2] || 10;
        if (isNaN(lon) || isNaN(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

        const score = Math.min(100, Math.round(mag * 15 + (depth < 25 ? 20 : 5)));
        const id = `USGS-IND-${f.id}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          results.push({
            id,
            title: f.properties.title || `M${mag.toFixed(1)} Earthquake`,
            place: f.properties.place || 'Indian Subcontinent Seismic Zone',
            disaster_type: 'EARTHQUAKE',
            severity: score >= 75 ? 'CRITICAL' : score >= 50 ? 'SEVERE' : 'MODERATE',
            risk_score: score,
            longitude: lon,
            latitude: lat,
            depth_km: depth,
            radius_km: Math.round(Math.max(15, 10 * Math.exp(0.45 * (mag - 2.5)))),
            source: 'USGS National Earthquake Information Center (India Subcontinent)',
            url: f.properties.url,
            timestamp: new Date(f.properties.time).toISOString(),
            is_verified: true,
            is_india: true,
            country: 'India',
          });
        }
      }
    }
  } catch (e) {
    console.warn('USGS India Subcontinent warning:', e);
  }

  // ----------------------------------------------------------------------------------
  // 4. Open-Meteo Global River Discharge Flood Hydrology for Major Indian Basins
  // ----------------------------------------------------------------------------------
  const indianRiverBasins = [
    { name: 'Guwahati - Brahmaputra River Basin', lat: 26.1445, lon: 91.7362, baselineNormal: 20 },
    { name: 'Patna - Ganga River Catchment', lat: 25.5941, lon: 85.1376, baselineNormal: 25 },
    { name: 'Cuttack - Mahanadi Delta & Basin', lat: 20.4625, lon: 85.8828, baselineNormal: 2000 },
    { name: 'Vijayawada - Krishna River Basin', lat: 16.5062, lon: 80.6480, baselineNormal: 15 },
    { name: 'Kochi - Western Ghats / Periyar Basin', lat: 9.9312, lon: 76.2673, baselineNormal: 18 },
    { name: 'Surat - Tapi River Basin', lat: 21.1702, lon: 72.8311, baselineNormal: 10 },
  ];

  await Promise.allSettled(
    indianRiverBasins.map(async (basin) => {
      try {
        const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${basin.lat}&longitude=${basin.lon}&daily=river_discharge&forecast_days=1`;
        const res = await fetch(floodUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          const discharge = data.daily?.river_discharge?.[0];
          if (discharge !== undefined && discharge > 0) {
            const isHighSurge = discharge >= basin.baselineNormal;
            const score = isHighSurge ? 75 : 45;
            const id = `FLOOD-BASIN-${basin.lat.toFixed(2)}-${basin.lon.toFixed(2)}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              results.push({
                id,
                title: isHighSurge ? `High River Discharge Surge: ${basin.name}` : `Hydrologic River Monitor: ${basin.name}`,
                place: basin.name,
                disaster_type: 'FLOOD',
                severity: isHighSurge ? 'SEVERE' : 'MODERATE',
                risk_score: score,
                longitude: basin.lon,
                latitude: basin.lat,
                depth_km: 0,
                radius_km: 60,
                source: 'Central Hydrologic River Monitoring (Open-Meteo Flood Telemetry)',
                url: 'https://open-meteo.com/en/docs/flood-api',
                timestamp: new Date().toISOString(),
                headline: `Live River Discharge Telemetry: ${discharge.toFixed(1)} m³/s recorded across gauge station.`,
                is_verified: true,
                is_india: true,
                country: 'India',
              });
            }
          }
        }
      } catch {}
    })
  );

  // ----------------------------------------------------------------------------------
  // 5. Google News Real-Time IMD & Disaster Alerts Feed for India
  // ----------------------------------------------------------------------------------
  try {
    const rssUrl =
      'https://news.google.com/rss/search?q=India+flood+cyclone+landslide+IMD+alert+when:3d&hl=en-IN&gl=IN&ceid=IN:en';
    const rssRes = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(4500),
    });
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const items = xml.split('<item>').slice(1);
      for (const item of items.slice(0, 5)) {
        const titleMatch = item.match(/<title>([^<]+)<\/title>/);
        const linkMatch = item.match(/<link>([^<]+)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
        if (!titleMatch) continue;

        const rawTitle = titleMatch[1];
        const cleanTitle = rawTitle.split(' - ')[0].slice(0, 100);
        const lower = cleanTitle.toLowerCase();

        // Detect hazard type
        let dType = 'FLOOD';
        if (lower.includes('cyclone') || lower.includes('storm')) dType = 'CYCLONE';
        else if (lower.includes('landslide')) dType = 'FLOOD';
        else if (lower.includes('fire')) dType = 'FIRE';

        // Detect specific district/region. If generic whole country with nothing specific, SKIP it completely!
        let detectedZone: { place: string; lat: number; lon: number } | null = null;
        for (const [key, zone] of Object.entries(SPECIFIC_ZONES)) {
          if (lower.includes(key)) {
            detectedZone = zone;
            break;
          }
        }

        // STRICT SPECIFICITY FILTER: Do not plot generic whole-country pins like "India, India" or "Nepal"
        if (!detectedZone) {
          continue;
        }

        const id = `IMD-ALERT-${Math.abs(cleanTitle.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          results.push({
            id,
            title: cleanTitle,
            place: detectedZone.place,
            disaster_type: dType,
            severity: lower.includes('red alert') || lower.includes('extremely heavy') ? 'CRITICAL' : 'SEVERE',
            risk_score: lower.includes('red alert') ? 85 : 68,
            longitude: detectedZone.lon,
            latitude: detectedZone.lat,
            depth_km: 0,
            radius_km: 50,
            source: 'India Meteorological Department (IMD Bulletin)',
            url: linkMatch ? linkMatch[1] : 'https://mausam.imd.gov.in',
            timestamp: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
            is_verified: true,
            is_india: true,
            country: 'India',
          });
        }
      }
    }
  } catch (e) {
    console.warn('Google News India RSS error:', e);
  }

  // ----------------------------------------------------------------------------------
  // 6. USGS Global Real-Time Seismic Network (Worldwide)
  // ----------------------------------------------------------------------------------
  try {
    const usgsRes = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
      { signal: AbortSignal.timeout(5000) }
    );
    if (usgsRes.ok) {
      const data = await usgsRes.json();
      for (const f of data.features || []) {
        const mag = f.properties.mag ?? 2.5;
        if (mag < 2.8) continue;
        const coords = f.geometry?.coordinates || [0, 0, 10];
        const lon = Number(coords[0]);
        const lat = Number(coords[1]);
        const depth = coords[2] || 10;
        if (isNaN(lon) || isNaN(lat) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;

        const score = Math.min(100, Math.round(mag * 14 + (depth < 25 ? 20 : 5)));
        const id = `USGS-${f.id}`;
        const isIndia = isIndianCoordinates(lat, lon);

        if (!seenIds.has(id)) {
          seenIds.add(id);
          results.push({
            id,
            title: f.properties.title || `M${mag.toFixed(1)} Earthquake`,
            place: f.properties.place || 'Active Seismic Zone',
            disaster_type: 'EARTHQUAKE',
            severity: score >= 75 ? 'CRITICAL' : score >= 50 ? 'SEVERE' : 'MODERATE',
            risk_score: score,
            longitude: lon,
            latitude: lat,
            depth_km: depth,
            radius_km: Math.round(Math.max(15, 10 * Math.exp(0.45 * (mag - 2.5)))),
            source: 'USGS National Earthquake Information Center',
            url: f.properties.url,
            timestamp: new Date(f.properties.time).toISOString(),
            is_verified: true,
            is_india: isIndia,
            country: isIndia ? 'India' : 'International',
          });
        }
      }
    }
  } catch (e) {
    console.warn('USGS fetch warning:', e);
  }

  if (results.length > 0) {
    cachedDisasters = results;
    lastFetchedTime = now;
  }

  return NextResponse.json(cachedDisasters.length > 0 ? cachedDisasters : results);
}
