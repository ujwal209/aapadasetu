import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const usgsRes = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson", {
      next: { revalidate: 120 }
    });
    if (usgsRes.ok) {
      const data = await usgsRes.json();
      const quakes = (data.features || []).filter((q: any) => (q.properties.mag ?? 0) >= 3.5).slice(0, 10);
      const dynamicAlerts = quakes.map((q: any) => {
        const mag = q.properties.mag ?? 3.5;
        const coords = q.geometry.coordinates || [0, 0, 10];
        const isCritical = mag >= 5.0;
        const radius = Math.round(Math.max(15, 10 * Math.exp(0.45 * (mag - 2.5))));
        return {
          id: `ALT-LIVE-${q.id.slice(-6)}`,
          title: `M${mag.toFixed(1)} Seismic Hazard: ${q.properties.place}`,
          disaster_type: 'EARTHQUAKE',
          severity: isCritical ? 'CRITICAL' : 'SEVERE',
          location: {
            latitude: coords[1],
            longitude: coords[0],
            location_name: q.properties.place,
            state: 'Global Epicenter',
            district: q.properties.place.split(',')[0] || 'Seismic Sector',
          },
          issued_at: new Date(q.properties.time).toISOString(),
          updated_at: new Date().toISOString(),
          impact_radius_km: radius,
          affected_population_estimate: Math.round(Math.pow(10, Math.min(6, mag))),
          headline: `Live USGS Alert: ${q.properties.title} recorded at depth of ${(coords[2] || 10).toFixed(1)} km.`,
          description: `Active tectonic dislocation reported by USGS National Earthquake Information Center. Hazard buffer zone extends ${radius} km from the epicenter.`,
          instructions: [
            'Drop, Cover, and Hold On immediately during tremors.',
            'Stay away from glass windows, unreinforced brick facades, and hanging fixtures.',
            'Shut down domestic gas valves and circuit breakers before evacuation.',
            'Monitor emergency local radio broadcasts on VHF band.'
          ],
          evacuation_active: isCritical,
          source_agency: 'USGS National Earthquake Information Center (NEIC)',
        };
      });
      return NextResponse.json(dynamicAlerts);
    }
  } catch {}
  return NextResponse.json([]);
}
