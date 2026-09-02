import { NextResponse } from 'next/server';

let sosBeacons: any[] = [];

export async function GET() {
  return NextResponse.json(sosBeacons);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const score = data.has_injured ? 95 : 85;
    const newBeacon = {
      id: `SOS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      contact_name: data.contact_name,
      phone_number: data.phone_number,
      category: data.category || 'TRAPPED_WATER',
      priority_score: score,
      people_count: data.people_count || 1,
      has_elderly_or_infants: data.has_elderly_or_infants || false,
      has_injured: data.has_injured || false,
      description: data.description || 'Emergency SOS',
      latitude: data.latitude,
      longitude: data.longitude,
      address_or_landmark: data.address_or_landmark || 'Designated Coordinates',
      status: 'PENDING',
      created_at: new Date().toISOString(),
      assigned_team: null,
    };
    sosBeacons.unshift(newBeacon);
    return NextResponse.json(newBeacon);
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to create beacon' }, { status: 400 });
  }
}
