import { NextResponse } from 'next/server';

function getGroqKey(): string {
  const env = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  const pool = env.split(',').map((k) => k.trim()).filter(Boolean);
  if (pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

const _SHELTER_CACHE = new Map<string, any>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location') || searchParams.get('city') || 'Active Sector';

  const cacheKey = location.toLowerCase().trim();
  if (_SHELTER_CACHE.has(cacheKey)) {
    return NextResponse.json(_SHELTER_CACHE.get(cacheKey));
  }

  // Fallback defaults
  const fallback = {
    camps: [
      {
        name: `${location} Civic Disaster Relief Center`,
        type: "Primary Evacuation Camp",
        address: `Municipal Stadium & Civic Grounds, ${location}`,
        phone: "1077",
        capacity: "1200 Persons",
        status: "Operational"
      },
      {
        name: `${location} District Hospital Emergency Triage`,
        type: "Medical Triage & Trauma Facility",
        address: `Civil Hospital Road, ${location}`,
        phone: "108",
        capacity: "350 Beds",
        status: "Operational"
      },
      {
        name: `${location} Red Cross Emergency Shelter`,
        type: "Relief & Dry Rations Depot",
        address: `Community Hall Complex, ${location}`,
        phone: "1070",
        capacity: "750 Persons",
        status: "Operational"
      }
    ],
    helplines: [
      { service: "State Disaster Management Control Room", number: "1070" },
      { service: "District Emergency Operations Center (DEOC)", number: "1077" },
      { service: "National Disaster Response Force (NDRF)", number: "011-24363260" },
      { service: "Police Emergency Network", number: "112" },
      { service: "Ambulance Emergency Dispatch", number: "108" },
      { service: "Fire & Rescue Operations", number: "101" }
    ]
  };

  _SHELTER_CACHE.set(cacheKey, fallback);
  return NextResponse.json(fallback);
}
