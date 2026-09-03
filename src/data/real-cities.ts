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

export const REAL_CITIES: EmbeddedCity[] = [
  // Major Indian Metros
  { id: 'DEL', name: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, population: 33000000, tier: 'MEGA_METRO', vulnerability_factor: 1.2 },
  { id: 'BOM', name: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0760, longitude: 72.8777, population: 21000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.4 },
  { id: 'BLR', name: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946, population: 13000000, tier: 'MEGA_METRO', vulnerability_factor: 0.8 },
  { id: 'CCU', name: 'Kolkata', state: 'West Bengal', country: 'India', latitude: 22.5726, longitude: 88.3639, population: 15000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.3 },
  { id: 'MAA', name: 'Chennai', state: 'Tamil Nadu', country: 'India', latitude: 13.0827, longitude: 80.2707, population: 11500000, tier: 'COASTAL_RISK', vulnerability_factor: 1.3 },
  { id: 'HYD', name: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867, population: 10500000, tier: 'METRO', vulnerability_factor: 0.8 },
  { id: 'AMD', name: 'Ahmedabad', state: 'Gujarat', country: 'India', latitude: 23.0225, longitude: 72.5714, population: 8400000, tier: 'METRO', vulnerability_factor: 1.1 },
  { id: 'PNQ', name: 'Pune', state: 'Maharashtra', country: 'India', latitude: 18.5204, longitude: 73.8567, population: 7200000, tier: 'METRO', vulnerability_factor: 0.9 },
  { id: 'JAI', name: 'Jaipur', state: 'Rajasthan', country: 'India', latitude: 26.9124, longitude: 75.7873, population: 4000000, tier: 'REGIONAL_HUB', vulnerability_factor: 0.9 },
  { id: 'LKO', name: 'Lucknow', state: 'Uttar Pradesh', country: 'India', latitude: 26.8467, longitude: 80.9462, population: 3800000, tier: 'REGIONAL_HUB', vulnerability_factor: 1.0 },
  { id: 'PAT', name: 'Patna', state: 'Bihar', country: 'India', latitude: 25.5941, longitude: 85.1376, population: 2500000, tier: 'REGIONAL_HUB', vulnerability_factor: 1.3 },
  { id: 'BBI', name: 'Bhubaneswar', state: 'Odisha', country: 'India', latitude: 20.2961, longitude: 85.8245, population: 1200000, tier: 'COASTAL_RISK', vulnerability_factor: 1.2 },
  { id: 'CTC', name: 'Cuttack', state: 'Odisha', country: 'India', latitude: 20.4625, longitude: 85.8828, population: 700000, tier: 'COASTAL_RISK', vulnerability_factor: 1.3 },
  { id: 'GAU', name: 'Guwahati', state: 'Assam', country: 'India', latitude: 26.1445, longitude: 91.7362, population: 1100000, tier: 'REGIONAL_HUB', vulnerability_factor: 1.4 },
  { id: 'COK', name: 'Kochi', state: 'Kerala', country: 'India', latitude: 9.9312, longitude: 76.2673, population: 2100000, tier: 'COASTAL_RISK', vulnerability_factor: 1.2 },
  { id: 'WYD', name: 'Wayanad', state: 'Kerala', country: 'India', latitude: 11.6854, longitude: 76.1320, population: 820000, tier: 'REGIONAL_HUB', vulnerability_factor: 1.5 },
  { id: 'SML', name: 'Shimla', state: 'Himachal Pradesh', country: 'India', latitude: 31.1048, longitude: 77.1734, population: 220000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.4 },
  { id: 'DED', name: 'Dehradun', state: 'Uttarakhand', country: 'India', latitude: 30.3165, longitude: 78.0322, population: 800000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.3 },
  { id: 'IXB', name: 'Darjeeling', state: 'West Bengal', country: 'India', latitude: 27.0410, longitude: 88.2663, population: 130000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.5 },
  { id: 'SXR', name: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', latitude: 34.0837, longitude: 74.7973, population: 1500000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.4 },
  { id: 'KTM', name: 'Kathmandu', country: 'Nepal', latitude: 27.7172, longitude: 85.3240, population: 1400000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.5 },

  // Key Global Hubs
  { id: 'TYO', name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, population: 37000000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.3 },
  { id: 'NYC', name: 'New York', country: 'USA', latitude: 40.7128, longitude: -74.0060, population: 19000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.0 },
  { id: 'LON', name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278, population: 9500000, tier: 'MEGA_METRO', vulnerability_factor: 0.8 },
  { id: 'SFO', name: 'San Francisco', country: 'USA', latitude: 37.7749, longitude: -122.4194, population: 4700000, tier: 'SEISMIC_ZONE', vulnerability_factor: 1.3 },
  { id: 'JKT', name: 'Jakarta', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, population: 11000000, tier: 'COASTAL_RISK', vulnerability_factor: 1.5 },
  { id: 'SIN', name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, population: 5900000, tier: 'COASTAL_RISK', vulnerability_factor: 0.7 },
  { id: 'SYD', name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, population: 5300000, tier: 'COASTAL_RISK', vulnerability_factor: 0.8 },
];
