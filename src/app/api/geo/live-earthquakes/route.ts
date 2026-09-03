import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Earthquakes are excluded per user directive:
 * Scope is strictly restricted to Floods and Landslides across India & Himalayan Region.
 */
export async function GET() {
  return NextResponse.json([]);
}
