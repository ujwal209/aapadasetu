/**
 * India & Himalayan Region Disaster Operational Division
 * High-resolution regional delineation for Flood & Landslide hazard management.
 * Clean, modern color-coding without numbered badges or clutter.
 */

export interface DisasterZone {
  id: string;
  zoneNumber: number;
  name: string;
  shortName: string;
  subtitle: string;
  description: string;
  primaryThreats: string[];
  keyBasins: string[];
  keyLandslideCorridors: string[];
  color: string;
  fillColor: string;
  borderColor: string;
  glowColor: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
  pitch: number;
  coordinates: [number, number][]; // Outer boundary polygon [lon, lat]
}

export const INDIA_DISASTER_ZONES: DisasterZone[] = [
  {
    id: 'ZONE-1-HIMALAYAN',
    zoneNumber: 1,
    name: 'Northern Himalayas & Karakoram',
    shortName: 'Northern Himalayas',
    subtitle: 'Ladakh, Jammu & Kashmir, Himachal Pradesh, Uttarakhand',
    description: 'High-altitude tectonic terrain prone to glacial lake outbursts (GLOF), cloudburst deluges, flash floods along Beas and Alaknanda, and mountain rock/debris avalanches.',
    primaryThreats: ['Cloudburst Flash Floods', 'Debris Avalanches', 'Slope Failure & Landslides', 'River Flash Surges'],
    keyBasins: ['Beas River Basin', 'Sutlej Gorge', 'Alaknanda Catchment', 'Bhagirathi Upper Reach', 'Jhelum Basin'],
    keyLandslideCorridors: ['Kullu-Manali-Rohtang', 'Chamoli-Joshimath', 'Mandi-Pandoh Highway', 'Kedarnath Valley', 'Jammu-Srinagar NH-44'],
    color: '#06B6D4', // Ice Cyan
    fillColor: 'rgba(6, 182, 212, 0.18)',
    borderColor: '#0891B2',
    glowColor: '#22D3EE',
    center: [77.2, 33.2],
    zoom: 5.2,
    pitch: 45,
    coordinates: [
      [73.5, 32.8],
      [73.5, 35.5],
      [76.0, 37.2],
      [79.0, 36.5],
      [80.5, 34.2],
      [81.2, 31.0],
      [80.5, 29.5],
      [78.8, 29.8],
      [77.5, 30.8],
      [75.5, 31.8],
      [73.5, 32.8],
    ],
  },
  {
    id: 'ZONE-2-NORTHEAST',
    zoneNumber: 2,
    name: 'North-Eastern Riverine Basin',
    shortName: 'North-East Riverine',
    subtitle: 'Assam, Arunachal Pradesh, Meghalaya, Sikkim, Nagaland, Manipur, Mizoram, Tripura',
    description: 'Extensive monsoonal river flooding across the Brahmaputra and Barak basins, combined with steep-slope mudslides across the Eastern Himalayas.',
    primaryThreats: ['Brahmaputra Valley Inundation', 'Embankment Breaches', 'Hill Slope Mudflows', 'River Island Submergence'],
    keyBasins: ['Brahmaputra Main Stem', 'Barak River', 'Teesta Basin', 'Subansiri Catchment', 'Dihing & Kopili'],
    keyLandslideCorridors: ['Dima Hasao Hill Rail Reach', 'East Kameng Foothills', 'Sikkim North Highway', 'Haflong Escarpment'],
    color: '#3B82F6', // Royal Electric Blue
    fillColor: 'rgba(59, 130, 246, 0.18)',
    borderColor: '#1D4ED8',
    glowColor: '#60A5FA',
    center: [93.0, 26.0],
    zoom: 5.2,
    pitch: 40,
    coordinates: [
      [88.0, 26.5],
      [88.2, 28.0],
      [92.0, 28.2],
      [96.0, 29.5],
      [97.5, 28.5],
      [97.0, 26.0],
      [95.5, 24.5],
      [93.5, 22.0],
      [91.5, 23.5],
      [89.8, 25.5],
      [88.0, 26.5],
    ],
  },
  {
    id: 'ZONE-3-GANGETIC',
    zoneNumber: 3,
    name: 'Indo-Gangetic & Nepal Basins',
    shortName: 'Gangetic & Nepal',
    subtitle: 'Nepal River Valleys, UP, Bihar, West Bengal, Delhi NCR, Punjab, Haryana',
    description: 'Alluvial floodplains and Himalayan river valleys subject to monsoonal river swelling, Kosi-Gandak flash inundation, riverbank erosion, and foothill slope failures.',
    primaryThreats: ['River Inundation', 'Riverbank Erosion', 'Waterlogging', 'Foothill Mudflows'],
    keyBasins: ['Ganga Main Channel', 'Kosi River Plain', 'Gandak & Narayani', 'Bagmati Reach', 'Trishuli & Karnali'],
    keyLandslideCorridors: ['Nepal Central Himalayan Slopes', 'Darjeeling-Kurseong Ridge', 'Shivalik Foot-Slopes'],
    color: '#F59E0B', // Amber Gold
    fillColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: '#B45309',
    glowColor: '#FBBF24',
    center: [82.5, 27.2],
    zoom: 4.8,
    pitch: 30,
    coordinates: [
      [73.8, 29.5],
      [75.5, 31.8],
      [77.5, 30.8],
      [78.8, 29.8],
      [80.5, 29.5],
      [84.5, 28.2],
      [88.0, 27.8],
      [89.8, 25.5],
      [88.8, 22.5],
      [86.8, 22.8],
      [84.0, 24.2],
      [81.0, 24.8],
      [77.5, 26.0],
      [74.0, 27.5],
      [73.8, 29.5],
    ],
  },
  {
    id: 'ZONE-4-WESTERNGHATS',
    zoneNumber: 4,
    name: 'Western Ghats & Coastal Escarpment',
    shortName: 'Western Ghats',
    subtitle: 'Maharashtra (Konkan & Ghats), Goa, Coastal Karnataka, Kerala',
    description: 'High-precipitation orographic escarpment experiencing extreme rainfall saturation, triggering debris flows, soil slips, and coastal flash floods.',
    primaryThreats: ['Rapid Debris Flows', 'Hillock Collapse & Mudslides', 'Flash Estuarine Flooding', 'Slope Liquefaction'],
    keyBasins: ['Chaliyar & Kabini', 'Periyar River', 'Netravati Basin', 'Savitri & Vashishti (Konkan)', 'Sharavathi'],
    keyLandslideCorridors: ['Wayanad (Meppadi-Chooralmala)', 'Idukki Pettimudi', 'Raigad Mahad Slopes', 'Kodagu (Coorg) Hills', 'Shirur Coastal Highway'],
    color: '#10B981', // Emerald Green
    fillColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#047857',
    glowColor: '#34D399',
    center: [75.0, 14.5],
    zoom: 5.0,
    pitch: 40,
    coordinates: [
      [72.5, 21.0],
      [74.2, 20.8],
      [74.8, 18.5],
      [75.5, 15.0],
      [76.5, 12.0],
      [77.5, 8.2],
      [76.5, 8.2],
      [75.2, 11.5],
      [74.0, 14.5],
      [73.0, 18.0],
      [72.5, 21.0],
    ],
  },
  {
    id: 'ZONE-5-PENINSULAR',
    zoneNumber: 5,
    name: 'Peninsular & Central Basins',
    shortName: 'Peninsular Basins',
    subtitle: 'Madhya Pradesh, Chhattisgarh, Odisha, Andhra Pradesh, Telangana, Tamil Nadu',
    description: 'Extensive central and deltaic river networks subject to reservoir gate discharges, backwater surges, and seasonal river basin inundation.',
    primaryThreats: ['Reservoir Discharge Surges', 'Coastal Delta Inundation', 'Estuary Tidal Surges', 'Central Basin Flash Floods'],
    keyBasins: ['Godavari Delta Catchment', 'Mahanadi Basin & Delta', 'Krishna River Reach', 'Narmada Basin', 'Cauvery Basin'],
    keyLandslideCorridors: ['Eastern Ghats Foot-Slopes', 'Nilgiris Upper Slopes', 'Simlipal Escarpment', 'Araku Valley'],
    color: '#8B5CF6', // Imperial Purple
    fillColor: 'rgba(139, 92, 246, 0.18)',
    borderColor: '#6D28D9',
    glowColor: '#A78BFA',
    center: [81.5, 18.5],
    zoom: 4.6,
    pitch: 30,
    coordinates: [
      [74.0, 27.5],
      [77.5, 26.0],
      [81.0, 24.8],
      [84.0, 24.2],
      [86.8, 22.8],
      [87.5, 21.5],
      [85.5, 18.5],
      [82.5, 16.0],
      [80.2, 13.0],
      [79.8, 10.0],
      [77.5, 8.2],
      [76.5, 12.0],
      [75.5, 15.0],
      [74.8, 18.5],
      [74.2, 20.8],
      [74.0, 27.5],
    ],
  },
];

/**
 * Identify which operational zone contains the given coordinate
 */
export function getDisasterZoneForCoords(lat: number, lon: number): DisasterZone {
  // Check Northern Himalayas
  if (lat >= 28.5 && lat <= 37.5 && lon >= 72.5 && lon <= 81.5) {
    return INDIA_DISASTER_ZONES[0];
  }
  // Check North-East
  if (lat >= 21.5 && lat <= 29.5 && lon >= 87.5 && lon <= 97.5) {
    return INDIA_DISASTER_ZONES[1];
  }
  // Check Western Ghats (western coastal & escarpment belt)
  if (lat >= 8.0 && lat <= 21.5 && lon >= 72.0 && lon <= 77.8) {
    return INDIA_DISASTER_ZONES[3];
  }
  // Check Gangetic & Nepal Plains
  if (lat >= 22.5 && lat <= 31.8 && lon >= 73.5 && lon <= 89.5) {
    return INDIA_DISASTER_ZONES[2];
  }
  // Default to Peninsular & Central Basins
  return INDIA_DISASTER_ZONES[4];
}

/**
 * Generate MapLibre / Leaflet GeoJSON FeatureCollection with pure color-coded styling properties
 */
export function getIndiaZonesGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: INDIA_DISASTER_ZONES.map((zone) => ({
      type: 'Feature',
      id: zone.id,
      properties: {
        id: zone.id,
        name: zone.name,
        shortName: zone.shortName,
        subtitle: zone.subtitle,
        description: zone.description,
        primaryThreats: zone.primaryThreats.join(', '),
        color: zone.color,
        fillColor: zone.fillColor,
        borderColor: zone.borderColor,
        glowColor: zone.glowColor,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [zone.coordinates],
      },
    })),
  };
}
