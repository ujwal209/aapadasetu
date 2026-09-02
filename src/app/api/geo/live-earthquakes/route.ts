import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const usgsRes = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", {
      next: { revalidate: 120 }
    });
    if (usgsRes.ok) {
      const data = await usgsRes.json();
      const quakes = (data.features || []).slice(0, 80).map((f: any) => {
        const mag = f.properties.mag ?? 2.5;
        const coords = f.geometry.coordinates || [0, 0, 10];
        const depth = coords[2] || 10;
        const score = Math.min(100, Math.round(mag * 14 + (depth < 25 ? 20 : 5)));
        return {
          id: f.id,
          title: f.properties.title,
          place: f.properties.place || 'Unknown Location',
          magnitude: mag,
          depth_km: depth,
          time: f.properties.time,
          url: f.properties.url,
          tsunami: f.properties.tsunami === 1,
          longitude: coords[0],
          latitude: coords[1],
          risk_score: score,
          severity: score >= 70 ? 'CRITICAL' : score >= 45 ? 'SEVERE' : 'MODERATE',
          buffer_radius_km: Math.round(Math.max(15, 10 * Math.exp(0.45 * (mag - 2.5)))),
        };
      });
      return NextResponse.json(quakes);
    }
  } catch (e) {
    console.warn("Live quakes error:", e);
  }
  return NextResponse.json([]);
}
