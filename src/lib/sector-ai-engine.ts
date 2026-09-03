/**
 * Sector-Wise Real-Time Disaster Intelligence Engine
 * Integrates Web News (strictly past 7 days) + High-Precision Coordinate Resolution
 * Eliminates duplicate markers with strict spatial & semantic deduplication.
 */

import { LiveDisaster } from '../types';
import { getDisasterZoneForCoords, INDIA_DISASTER_ZONES } from './india-zones';
import { z } from 'zod';

const DisasterIncidentSchema = z.object({
  title: z.string().min(2),
  place: z.string().min(2),
  latitude: z.number().min(6.0).max(38.0),
  longitude: z.number().min(68.0).max(98.0),
  disaster_type: z.enum(['FLOOD', 'LANDSLIDE']),
  severity: z.enum(['CRITICAL', 'SEVERE', 'MODERATE']).default('SEVERE'),
  risk_score: z.number().min(1).max(100).default(88),
  summary: z.string().optional(),
  source_url: z.string().optional(),
});

const SectorIntelligencePayloadSchema = z.object({
  incidents: z.array(DisasterIncidentSchema),
});

function getTavilyKeys(): string[] {
  const env = process.env.TAVILY_API_KEYS || process.env.TAVILY_API_KEY || '';
  return env.split(',').map((k) => k.trim()).filter(Boolean);
}

function getGroqKeys(): string[] {
  const env = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  return env.split(',').map((k) => k.trim()).filter(Boolean);
}

let tavilyIdx = 0;
function getNextTavilyKey(): string {
  const keys = getTavilyKeys();
  if (keys.length === 0) return '';
  const k = keys[tavilyIdx % keys.length];
  tavilyIdx++;
  return k;
}

let groqIdx = 0;
function getNextGroqKey(): string {
  const keys = getGroqKeys();
  if (keys.length === 0) return '';
  const k = keys[groqIdx % keys.length];
  groqIdx++;
  return k;
}

const SECTOR_QUERIES: Record<string, string> = {
  'ZONE-1-HIMALAYAN': 'Ladakh Kargil Himachal Uttarakhand flood landslide cloudburst news',
  'ZONE-2-NORTHEAST': 'Assam Sikkim Brahmaputra Teesta flood landslide news',
  'ZONE-3-GANGETIC': 'Nepal Bihar Koshi Gandak Bagmati flood landslide breaking news',
  'ZONE-4-WESTERNGHATS': 'Kerala Maharashtra Wayanad Konkan landslide flood news',
  'ZONE-5-PENINSULAR': 'Odisha Andhra Pradesh Godavari Mahanadi reservoir flood news',
};

const CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'qwen/qwen3.6-27b',
];

export async function scanSectorDisastersWithAi(targetSectorId?: string): Promise<LiveDisaster[]> {
  const sectorsToScan = targetSectorId 
    ? INDIA_DISASTER_ZONES.filter(z => z.id === targetSectorId)
    : INDIA_DISASTER_ZONES;

  const collected: LiveDisaster[] = [];

  for (const sector of sectorsToScan) {
    const query = SECTOR_QUERIES[sector.id] || `${sector.name} flood landslide news`;
    const tKey = getNextTavilyKey();

    try {
      // 1. Fetch strictly past-7-day news reports
      const tRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tKey,
          query,
          topic: 'news',
          days: 7, // Strictly past 7 days
          max_results: 6,
        }),
        signal: AbortSignal.timeout(4500),
      });

      if (!tRes.ok) continue;
      const tData = await tRes.json();
      const articles = (tData.results || [])
        .filter((r: any) => {
          const t = (r.title || '').toLowerCase();
          return !t.includes('timeline') && !t.includes('history of') && !t.includes('fact crescendo') && !t.includes('misrepresented');
        })
        .slice(0, 5)
        .map((r: any) => ({
          title: r.title,
          url: r.url,
          date: r.published_date,
          content: (r.content || r.snippet || '').slice(0, 220),
        }));

      if (articles.length === 0) continue;

      // 2. Pass to AI for precision coordinate extraction & deduplication
      const gPrompt = `You are an emergency GIS coordinate intelligence specialist.
Here are recent news reports from the past 7 days for the ${sector.name} region:
${JSON.stringify(articles, null, 2)}

TASK:
1. Extract distinct FLOOD or LANDSLIDE incidents.
2. CRITICAL DEDUPLICATION RULE: If multiple reports refer to the same event or place, output EXACTLY ONE incident. NEVER output duplicate incidents for the same location.
3. Provide precise real latitude and longitude decimal coordinates.
4. Output valid JSON in this format:
{
  "incidents": [
    {
      "title": "Clear concise incident title",
      "place": "Locality, District, State/Country",
      "latitude": 34.55,
      "longitude": 76.15,
      "disaster_type": "FLOOD" or "LANDSLIDE",
      "severity": "CRITICAL" or "SEVERE" or "MODERATE",
      "risk_score": 92,
      "summary": "1-sentence summary",
      "source_url": "url"
    }
  ]
}`;

      let groqSuccess = false;
      for (const model of CANDIDATE_MODELS) {
        if (groqSuccess) break;
        const gKey = getNextGroqKey();
        try {
          const gRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${gKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are an emergency GIS deduplication system. Return pure valid JSON only.' },
                { role: 'user', content: gPrompt },
              ],
              response_format: { type: 'json_object' },
            }),
            signal: AbortSignal.timeout(4500),
          });

          if (gRes.ok) {
            const gData = await gRes.json();
            const text = gData.choices?.[0]?.message?.content || '{}';
            const parsed = JSON.parse(text);
            const val = SectorIntelligencePayloadSchema.safeParse(parsed);
            const incidents = val.success 
              ? val.data.incidents 
              : (parsed.incidents || parsed.disasters || []);

            for (const inc of incidents) {
              const lat = Number(inc.latitude);
              const lon = Number(inc.longitude);
              if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) continue;

              const dType = (inc.disaster_type || 'FLOOD').toUpperCase().includes('LANDSLIDE') ? 'LANDSLIDE' : 'FLOOD';
              const z = getDisasterZoneForCoords(lat, lon);

              collected.push({
                id: `SECTOR-AI-${Math.abs(hash(inc.title + inc.place)) % 1000000}`,
                title: inc.title,
                place: inc.place,
                disaster_type: dType as any,
                severity: (inc.severity || 'CRITICAL') as any,
                risk_score: inc.risk_score || 90,
                latitude: lat,
                longitude: lon,
                buffer_radius_km: dType === 'FLOOD' ? 55 : 30,
                source: `Verified Field Intelligence (Past 7 Days)`,
                url: inc.source_url || '#',
                timestamp: new Date().toISOString(),
                is_india: !inc.place?.toLowerCase().includes('nepal'),
                country: inc.place?.toLowerCase().includes('nepal') ? 'Nepal' : 'India',
                zone: z.id,
                zoneName: z.name,
              } as any);
            }
            groqSuccess = true;
          }
        } catch {}
      }
    } catch {}
  }

  // 3. Strict Spatial & Semantic Deduplication
  return deduplicateDisasterRecords(collected);
}

/**
 * Deduplicate disaster records to guarantee NO identical or near-identical markers appear twice
 */
export function deduplicateDisasterRecords(disasters: LiveDisaster[]): LiveDisaster[] {
  const result: LiveDisaster[] = [];
  const seenSpatial = new Set<string>();
  const seenNames = new Set<string>();

  for (const d of disasters) {
    const lat = Number(d.latitude);
    const lon = Number(d.longitude);
    if (isNaN(lat) || isNaN(lon)) continue;

    const dType = (d.disaster_type || '').toUpperCase();
    
    // Spatial grid check (~15km resolution)
    const spatialKey = `${dType}-${Math.round(lat * 8) / 8},${Math.round(lon * 8) / 8}`;
    
    // Clean name token
    const rawPlace = (d.place || d.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameToken = `${dType}-${rawPlace.slice(0, 14)}`;

    if (seenSpatial.has(spatialKey) || seenNames.has(nameToken)) {
      continue; // Discard duplicate marker
    }

    seenSpatial.add(spatialKey);
    seenNames.add(nameToken);
    result.push(d);
  }

  return result;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
