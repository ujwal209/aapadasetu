import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    active_alerts_count: 8,
    critical_alerts_count: 3,
    pending_sos_count: 2,
    rescued_citizens_count: 1842,
    total_shelters_active: 14,
    total_shelter_capacity: 12500,
    current_shelter_occupancy: 8640,
    deployed_rescue_teams: 48,
    medical_units_deployed: 24,
    water_litres_dispatched: 125000,
    food_packets_dispatched: 64200,
  });
}
