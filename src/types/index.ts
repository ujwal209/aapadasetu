export type AlertSeverity = 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'WATCH';

export type DisasterType = 
  | 'CYCLONE' 
  | 'FLOOD' 
  | 'EARTHQUAKE' 
  | 'LANDSLIDE' 
  | 'TSUNAMI' 
  | 'HEATWAVE' 
  | 'FOREST_FIRE';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  location_name: string;
  state: string;
  district: string;
}

export interface DisasterAlert {
  id: string;
  title: string;
  disaster_type: DisasterType;
  severity: AlertSeverity;
  location: GeoCoordinates;
  issued_at: string;
  updated_at: string;
  impact_radius_km: number;
  affected_population_estimate: number;
  headline: string;
  description: string;
  instructions: string[];
  evacuation_active: boolean;
  source_agency: string;
}

export type EmergencyCategory = 
  | 'TRAPPED_WATER'
  | 'MEDICAL_CRITICAL'
  | 'STRUCTURAL_COLLAPSE'
  | 'FIRE_SMOKE'
  | 'FOOD_WATER_DEPLETED'
  | 'MISSING_PERSON'
  | 'OTHER';

export type SOSStatus = 'PENDING' | 'TRIAGED' | 'DISPATCHED' | 'RESCUED' | 'CANCELLED';

export interface DistressBeacon {
  id: string;
  contact_name: string;
  phone_number: string;
  category: EmergencyCategory;
  priority_score: number;
  people_count: number;
  has_elderly_or_infants: boolean;
  has_injured: boolean;
  description: string;
  latitude: number;
  longitude: number;
  address_or_landmark: string;
  status: SOSStatus;
  created_at: string;
  assigned_team?: string | null;
}

export interface DistressBeaconCreate {
  contact_name: string;
  phone_number: string;
  category: EmergencyCategory;
  people_count: number;
  has_elderly_or_infants: boolean;
  has_injured: boolean;
  description: string;
  latitude: number;
  longitude: number;
  address_or_landmark: string;
  battery_level_percent?: number;
}

export type ShelterStatus = 'OPERATIONAL' | 'NEAR_FULL' | 'FULL' | 'STANDBY';

export interface ReliefShelter {
  id: string;
  name: string;
  district: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  current_occupancy: number;
  status: ShelterStatus;
  has_medical_facility: boolean;
  has_food_rations: boolean;
  has_backup_power: boolean;
  contact_person: string;
  contact_phone: string;
  camp_commander: string;
}

export type ResourceCategory = 
  | 'MEDICAL'
  | 'RATIONS_FOOD'
  | 'WATER_SANITATION'
  | 'RESCUE_GEAR'
  | 'POWER_COMMS'
  | 'SHELTER_KITS';

export interface ResourceStock {
  id: string;
  item_name: string;
  category: ResourceCategory;
  quantity: number;
  unit: string;
  warehouse_location: string;
  district: string;
  status: 'SUFFICIENT' | 'LOW_STOCK' | 'CRITICAL_DEFICIT';
  allocated_quantity: number;
}

export interface DashboardStats {
  active_alerts_count: number;
  critical_alerts_count: number;
  pending_sos_count: number;
  rescued_citizens_count: number;
  total_shelters_active: number;
  total_shelter_capacity: number;
  current_shelter_occupancy: number;
  deployed_rescue_teams: number;
  medical_units_deployed: number;
  water_litres_dispatched: number;
  food_packets_dispatched: number;
}

export interface LiveEarthquake {
  id: string;
  title: string;
  place: string;
  magnitude: number;
  depth_km: number;
  time: number;
  url: string;
  tsunami: boolean;
  longitude: number;
  latitude: number;
  risk_score: number;
  severity: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'WATCH';
  buffer_radius_km: number;
}

export interface LocalityRisk {
  locality: string;
  city: string;
  state: string;
  country: string;
  display_name: string;
  latitude: number;
  longitude: number;
  threat_level: 'CRITICAL' | 'SEVERE' | 'MODERATE' | 'LOW';
  threat_message: string;
  nearest_hazard?: {
    title: string;
    magnitude: number;
    distance_km: number;
    depth_km: number;
    place: string;
  } | null;
}

export interface LiveDisaster {
  id: string;
  title: string;
  place: string;
  disaster_type: 'FLOOD' | 'EARTHQUAKE' | 'CYCLONE' | 'TSUNAMI' | 'FIRE';
  severity: 'CRITICAL' | 'SEVERE' | 'MODERATE';
  magnitude?: number | null;
  latitude: number;
  longitude: number;
  depth_km?: number | null;
  buffer_radius_km: number;
  source: string;
  url?: string;
  risk_score?: number;
}
