export interface EmbeddedCity {
  id: string;
  name: string;
  country: string;
  state?: string;
  latitude: number;
  longitude: number;
  population: number;
  tier: 'MEGA_METRO' | 'METRO' | 'REGIONAL_HUB' | 'COASTAL_RISK' | 'SEISMIC_ZONE';
  vulnerability_factor: number;
}

// Only Key Important Anchor Metros (No Minor Regional Town Clutter)
export const REAL_CITIES: EmbeddedCity[] = [
  // Major Indian Strategic Metros
  { id: 'DEL', name: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, population: 33000000, tier: 'MEGA_METRO', vulnerability_factor: 1.2 },
  { id: 'BOM', name: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777, population: 21000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.4 },
  { id: 'CCU', name: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639, population: 15000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.3 },
  { id: 'MAA', name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707, population: 11500000, tier: 'COASTAL_RISK', vulnerability_factor: 1.3 },
  { id: 'BLR', name: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, population: 13000000, tier: 'MEGA_METRO', vulnerability_factor: 0.8 },
  { id: 'HYD', name: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867, population: 10500000, tier: 'METRO', vulnerability_factor: 0.8 },

  // Key Global Hubs
  { id: 'TYO', name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, population: 37000000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.3 },
  { id: 'NYC', name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, population: 19000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.0 },
  { id: 'LON', name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278, population: 9500000, tier: 'MEGA_METRO', vulnerability_factor: 0.8 },
  { id: 'SFO', name: 'San Francisco', country: 'USA', latitude: 37.7749, longitude: -122.4194, population: 4700000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.3 },
  { id: 'JKT', name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, population: 11000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.5 },
  { id: 'SIN', name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, population: 5900000, tier: 'COASTAL_RISK', vulnerability_factor: 0.7 },
  { id: 'SYD', name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, population: 5300000, tier: 'COASTAL_RISK', vulnerability_factor: 0.8 },
];
