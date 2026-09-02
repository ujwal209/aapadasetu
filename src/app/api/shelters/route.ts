import { NextResponse } from 'next/server';

export async function GET() {
  const shelters = [
    {
      id: "SHL-PURI-01",
      name: "Puri Multipurpose Cyclone Shelter Complex",
      district: "Puri",
      state: "Odisha",
      address: "VIP Road, Near Sea Beach Police Station, Puri",
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
  return NextResponse.json(shelters);
}
