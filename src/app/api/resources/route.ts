import { NextResponse } from 'next/server';

export async function GET() {
  const resources = [
    {
      id: "RES-MED-01",
      item_name: "Trauma Response First-Aid Kits",
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
      district: "Kamrup",
      status: "SUFFICIENT",
      allocated_quantity: 32000
    },
    {
      id: "RES-RAT-03",
      item_name: "Emergency Dry Rations Packets",
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
      item_name: "Silent Diesel Generators (15 kVA)",
      category: "POWER_COMMS",
      quantity: 45,
      unit: "Units",
      warehouse_location: "Central Civil Defence Depot, Guwahati",
      district: "Kamrup",
      status: "SUFFICIENT",
      allocated_quantity: 22
    }
  ];
  return NextResponse.json(resources);
}
