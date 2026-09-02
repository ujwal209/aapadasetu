import { DisasterAlert, ReliefShelter, DistressBeacon, ResourceStock, DashboardStats } from '../types';

export const INITIAL_STATS: DashboardStats = {
  active_alerts_count: 4,
  critical_alerts_count: 2,
  pending_sos_count: 3,
  rescued_citizens_count: 1842,
  total_shelters_active: 14,
  total_shelter_capacity: 12500,
  current_shelter_occupancy: 8640,
  deployed_rescue_teams: 48,
  medical_units_deployed: 24,
  water_litres_dispatched: 125000,
  food_packets_dispatched: 64200,
};

export const MOCK_ALERTS: DisasterAlert[] = [
  {
    id: "ALT-2026-0901",
    title: "Severe Cyclonic Storm 'Varuna' Landfall Warning",
    disaster_type: "CYCLONE",
    severity: "CRITICAL",
    location: {
      latitude: 19.8135,
      longitude: 85.8312,
      location_name: "Puri Coastal Belt",
      state: "Odisha",
      district: "Puri"
    },
    issued_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60000).toISOString(),
    impact_radius_km: 145.0,
    affected_population_estimate: 480000,
    headline: "Maximum sustained wind speed 130-145 kmph gusting to 160 kmph.",
    description: "Severe Cyclonic Storm 'Varuna' has intensified over Bay of Bengal and is moving north-northwestwards. Storm surge of 2.5m above astronomical tide expected to inundate low-lying coastal villages.",
    instructions: [
      "Total suspension of fishing operations in deep and coastal waters.",
      "Evacuate vulnerable kutcha settlements to designated Cyclone Shelters.",
      "Keep emergency battery lanterns, dry rations, and potable water ready.",
      "Stay clear of coastal road stretches and high-voltage transmission lines."
    ],
    evacuation_active: true,
    source_agency: "IMD Cyclone Warning Division / OSDMA"
  },
  {
    id: "ALT-2026-0902",
    title: "Flash Flood & River Inundation Alert - Brahmaputra Basin",
    disaster_type: "FLOOD",
    severity: "SEVERE",
    location: {
      latitude: 26.1445,
      longitude: 91.7362,
      location_name: "Guwahati & Kamrup Riverine",
      state: "Assam",
      district: "Kamrup Metropolitan"
    },
    issued_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60000).toISOString(),
    impact_radius_km: 85.0,
    affected_population_estimate: 210000,
    headline: "Brahmaputra flowing 1.4m above danger mark at Neamatighat and Bharalumukh.",
    description: "Continuous heavy torrential rainfall across catchment areas in upper reaches has led to embankment overflow. Inundation reported across 42 revenue circles.",
    instructions: [
      "Relocate livestock and essential equipment to elevated highland shelters.",
      "Avoid wading through flood water; beware of submerged open drains and snakes.",
      "Boil all drinking water or use halogen water purification tablets.",
      "Contact SDRF boat dispatch at Toll-Free 1070 for immediate water rescue."
    ],
    evacuation_active: true,
    source_agency: "Central Water Commission (CWC) / ASDMA"
  },
  {
    id: "ALT-2026-0903",
    title: "High-Risk Landslide Hazard - Debris Flow Alert",
    disaster_type: "LANDSLIDE",
    severity: "CRITICAL",
    location: {
      latitude: 11.5833,
      longitude: 76.1383,
      location_name: "Meppadi - Chooralmala Hills",
      state: "Kerala",
      district: "Wayanad"
    },
    issued_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
    impact_radius_km: 25.0,
    affected_population_estimate: 32000,
    headline: "Soil saturation indices breached critical threshold; active mudslip reported.",
    description: "Severe precipitation exceeding 280mm in 24 hours has destabilized slope profiles. Secondary landslips probable along hill road connectors.",
    instructions: [
      "Immediate preventative evacuation from riverbanks and steep slope foothills.",
      "No vehicular movement permitted on Ghat roads post-sunset.",
      "Assemble at designated Government High School relief camps."
    ],
    evacuation_active: true,
    source_agency: "Geological Survey of India (GSI) / KSDMA"
  },
  {
    id: "ALT-2026-0904",
    title: "Seismic Tremor & Structural Vigilance Advisory",
    disaster_type: "EARTHQUAKE",
    severity: "MODERATE",
    location: {
      latitude: 30.3165,
      longitude: 78.0322,
      location_name: "Dehradun - Chamoli Rift Zone",
      state: "Uttarakhand",
      district: "Dehradun"
    },
    issued_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60000).toISOString(),
    impact_radius_km: 110.0,
    affected_population_estimate: 150000,
    headline: "M4.6 seismic event recorded at 10km focal depth; aftershock monitoring ongoing.",
    description: "Mild structural cracks observed in older unreinforced masonry structures. Rapid assessment teams deployed to inspect major bridge pillars and tunnel portals.",
    instructions: [
      "Inspect domestic gas lines and power breaker panels before entering buildings.",
      "Practice Drop, Cover, and Hold On during aftershocks.",
      "Keep emergency grab-bags accessible."
    ],
    evacuation_active: false,
    source_agency: "National Centre for Seismology (NCS)"
  }
];

export const MOCK_SHELTERS: ReliefShelter[] = [
  {
    id: "SHL-PURI-01",
    name: "Puri Multipurpose Cyclone Shelter Complex",
    district: "Puri",
    state: "Odisha",
    address: "Near Sea Beach Police Station, VIP Road, Puri",
    latitude: 19.8050,
    longitude: 85.8240,
    total_capacity: 1500,
    current_occupancy: 1180,
    status: "NEAR_FULL",
    has_medical_facility: true,
    has_food_rations: true,
    has_backup_power: true,
    contact_person: "Ramesh Chandra Dash (OAS)",
    contact_phone: "+91 94370 12345",
    camp_commander: "OSDMA Battalion Unit 3"
  },
  {
    id: "SHL-PURI-02",
    name: "Konark High School Relief & Medical Camp",
    district: "Puri",
    state: "Odisha",
    address: "State Highway 13, Konark",
    latitude: 19.8876,
    longitude: 86.0945,
    total_capacity: 800,
    current_occupancy: 320,
    status: "OPERATIONAL",
    has_medical_facility: true,
    has_food_rations: true,
    has_backup_power: true,
    contact_person: "Priyanka Mohapatra",
    contact_phone: "+91 94371 98765",
    camp_commander: "Red Cross Disaster Response"
  },
  {
    id: "SHL-GHY-01",
    name: "Sarada Stadium Indoor Flood Relief Shelter",
    district: "Kamrup Metropolitan",
    state: "Assam",
    address: "Bhangagarh Central, Guwahati",
    latitude: 26.1520,
    longitude: 91.7580,
    total_capacity: 2200,
    current_occupancy: 1450,
    status: "OPERATIONAL",
    has_medical_facility: true,
    has_food_rations: true,
    has_backup_power: true,
    contact_person: "Bikash Kalita",
    contact_phone: "+91 98640 55432",
    camp_commander: "1st NDRF Battalion Guwahati"
  },
  {
    id: "SHL-WYD-01",
    name: "St. Joseph Community Hall Emergency Camp",
    district: "Wayanad",
    state: "Kerala",
    address: "Meppadi Junction, Wayanad",
    latitude: 11.5540,
    longitude: 76.1280,
    total_capacity: 600,
    current_occupancy: 540,
    status: "NEAR_FULL",
    has_medical_facility: true,
    has_food_rations: true,
    has_backup_power: false,
    contact_person: "Sister Alphonsa Mathew",
    contact_phone: "+91 94472 11223",
    camp_commander: "Kerala Fire & Rescue Squad 7"
  }
];

export const MOCK_SOS_BEACONS: DistressBeacon[] = [
  {
    id: "SOS-8821",
    contact_name: "Sunil Patnaik",
    phone_number: "+91 98610 44321",
    category: "TRAPPED_WATER",
    priority_score: 94,
    people_count: 6,
    has_elderly_or_infants: true,
    has_injured: false,
    description: "Water level touched ground floor ceiling. 2 infants and 80-year-old grandmother trapped on asbestos roof. Urgent boat rescue needed.",
    latitude: 19.8210,
    longitude: 85.8450,
    address_or_landmark: "Behind Jagannath Dairy, Balisahi, Puri",
    status: "DISPATCHED",
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
    assigned_team: "NDRF Team Bravo-04 (Gemini Craft)"
  },
  {
    id: "SOS-8822",
    contact_name: "Himanta Bora",
    phone_number: "+91 97060 12890",
    category: "MEDICAL_CRITICAL",
    priority_score: 98,
    people_count: 3,
    has_elderly_or_infants: false,
    has_injured: true,
    description: "Severe chest trauma and compound fracture caused by falling masonry. Bleeding not arrested. Need emergency aero-medical evacuation.",
    latitude: 26.1380,
    longitude: 91.7410,
    address_or_landmark: "Near Old Toll Gate, Bharalumukh, Guwahati",
    status: "TRIAGED",
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    assigned_team: "SDRF Quick Reaction Medical Ambulance"
  },
  {
    id: "SOS-8823",
    contact_name: "Ananya Nambiar",
    phone_number: "+91 98471 77654",
    category: "STRUCTURAL_COLLAPSE",
    priority_score: 89,
    people_count: 4,
    has_elderly_or_infants: true,
    has_injured: true,
    description: "Mudslide hit rear wall of tea plantation quarters. Family stuck inside kitchen area. Pathway blocked by uprooted eucalyptus tree.",
    latitude: 11.5790,
    longitude: 76.1350,
    address_or_landmark: "Tea Estate Line 4, Chooralmala, Wayanad",
    status: "PENDING",
    created_at: new Date(Date.now() - 7 * 60000).toISOString(),
    assigned_team: null
  }
];

export const MOCK_RESOURCES: ResourceStock[] = [
  {
    id: "RES-MED-01",
    item_name: "Trauma Response Surgical First-Aid Kits",
    category: "MEDICAL",
    quantity: 340,
    unit: "Kits",
    warehouse_location: "Regional Disaster Supply Depot, Bhubaneswar",
    district: "Khurda",
    status: "SUFFICIENT",
    allocated_quantity: 180
  },
  {
    id: "RES-WAT-02",
    item_name: "Packaged Drinking Water Pouches (500ml)",
    category: "WATER_SANITATION",
    quantity: 45000,
    unit: "Pouches",
    warehouse_location: "Guwahati Inland Port Logistics Yard",
    district: "Kamrup Metropolitan",
    status: "SUFFICIENT",
    allocated_quantity: 32000
  },
  {
    id: "RES-RAT-03",
    item_name: "Ready-To-Eat Dry Emergency Food Rations",
    category: "RATIONS_FOOD",
    quantity: 8200,
    unit: "Meal Packs",
    warehouse_location: "Calicut Supply Logistics Center",
    district: "Kozhikode",
    status: "LOW_STOCK",
    allocated_quantity: 7400
  },
  {
    id: "RES-GEA-04",
    item_name: "Inflatable Rescue Boats (IRB) with 40HP OBM",
    category: "RESCUE_GEAR",
    quantity: 28,
    unit: "Crafts",
    warehouse_location: "Puri Coastal Tactical Base",
    district: "Puri",
    status: "CRITICAL_DEFICIT",
    allocated_quantity: 26
  },
  {
    id: "RES-PWR-05",
    item_name: "Silent Diesel Portable Generators (15 kVA)",
    category: "POWER_COMMS",
    quantity: 45,
    unit: "Units",
    warehouse_location: "Central Civil Defence Depot, Guwahati",
    district: "Kamrup",
    status: "SUFFICIENT",
    allocated_quantity: 22
  }
];

export const EMERGENCY_HELPLINES = [
  { name: "National Disaster Response Force (NDRF)", number: "1078", tollFree: true, desc: "24/7 National Search & Rescue Command" },
  { name: "Emergency Response Support System (ERSS)", number: "112", tollFree: true, desc: "Unified Single Emergency Helpline" },
  { name: "Disaster Management Control Room (State)", number: "1070", tollFree: true, desc: "State Disaster Authority Operations Center" },
  { name: "Ambulance & Trauma Medical First Response", number: "108", tollFree: true, desc: "Emergency Medical & Paramedic Dispatch" },
  { name: "Indian Coast Guard Maritime SAR", number: "1554", tollFree: true, desc: "Offshore, Cyclone & Maritime Distress" },
  { name: "Fire & Rescue Operations", number: "101", tollFree: true, desc: "Urban Hazard, Collapse & Extrication" },
];
