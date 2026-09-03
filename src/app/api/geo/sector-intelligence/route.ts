import { NextResponse } from 'next/server';
import { scanSectorDisastersWithAi, deduplicateDisasterRecords } from '@/lib/sector-ai-engine';

export const dynamic = 'force-dynamic';

let sectorCache: Record<string, { time: number; data: any[] }> = {};
const CACHE_TTL_MS = 90 * 1000; // 90 second cache for fast live responses

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sector = url.searchParams.get('sector') || 'all';

  const now = Date.now();
  if (sectorCache[sector] && (now - sectorCache[sector].time < CACHE_TTL_MS)) {
    return NextResponse.json(sectorCache[sector].data);
  }

  try {
    const targetSector = sector === 'all' ? undefined : sector;
    const disasters = await scanSectorDisastersWithAi(targetSector);
    const deduped = deduplicateDisasterRecords(disasters);

    sectorCache[sector] = { time: now, data: deduped };
    return NextResponse.json(deduped);
  } catch (e: any) {
    return NextResponse.json([], { status: 500 });
  }
}
