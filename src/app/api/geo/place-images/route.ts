import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PlaceImageResponse {
  city: string;
  parentCity: string;
  state?: string;
  title?: string;
  summary?: string;
  photoUrl?: string | null;
  photoUrls: string[];
}

const MEMORY_CACHE = new Map<string, { data: PlaceImageResponse; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

// Curated high-resolution city photos for major Indian hubs as reliable fallback
const CURATED_CITY_PHOTOS: Record<string, string[]> = {
  puri: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shri_Jagannatha_Temple.jpg/1280px-Shri_Jagannatha_Temple.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Puri_sea_beach.jpg/1280px-Puri_sea_beach.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Konark_Sun_Temple_%28edit%29.jpg/1280px-Konark_Sun_Temple_%28edit%29.jpg',
  ],
  bengaluru: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/View_from_Visvesvaraya_Industrial_and_Technological_Museum_%282025%29_02.jpg/1280px-View_from_Visvesvaraya_Industrial_and_Technological_Museum_%282025%29_02.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Aerial_view_of_a_TV_Tower_in_Bangalore_%282%29.jpg/1280px-Aerial_view_of_a_TV_Tower_in_Bangalore_%282%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/UB_City_Skyline.jpg/1280px-UB_City_Skyline.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Dharmaraya_Swamy_Temple_Bangalore_edit1.jpg/1280px-Dharmaraya_Swamy_Temple_Bangalore_edit1.jpg',
  ],
  bangalore: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/View_from_Visvesvaraya_Industrial_and_Technological_Museum_%282025%29_02.jpg/1280px-View_from_Visvesvaraya_Industrial_and_Technological_Museum_%282025%29_02.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Aerial_view_of_a_TV_Tower_in_Bangalore_%282%29.jpg/1280px-Aerial_view_of_a_TV_Tower_in_Bangalore_%282%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/UB_City_Skyline.jpg/1280px-UB_City_Skyline.jpg',
  ],
  mumbai: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Mumbai_Bandra-Worli_Sea_Link.jpg/1280px-Mumbai_Bandra-Worli_Sea_Link.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Gateway_of_India_sunset.jpg/1280px-Gateway_of_India_sunset.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Chhatrapati_Shivaji_Terminus_railway_station%2C_Mumbai.jpg/1280px-Chhatrapati_Shivaji_Terminus_railway_station%2C_Mumbai.jpg',
  ],
  delhi: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Jama_Masjid_2011.jpg/1280px-Jama_Masjid_2011.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/India_Gate_in_New_Delhi_03-2016.jpg/1280px-India_Gate_in_New_Delhi_03-2016.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Delhi_Red_fort.jpg/1280px-Delhi_Red_fort.jpg',
  ],
  wayanad: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Blue%2C_Green_%26_White.jpg/1280px-Blue%2C_Green_%26_White.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Karapuzha_Dam_Wayanad_Kerala.jpg/1280px-Karapuzha_Dam_Wayanad_Kerala.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Edakkal_Caves_Wayand.jpg/1280px-Edakkal_Caves_Wayand.jpg',
  ],
  guwahati: [
    'https://upload.wikimedia.org/wikipedia/commons/1/11/Guwahati_citysky.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Kamakhya_Temple_Guwahati.jpg/1280px-Kamakhya_Temple_Guwahati.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Brahmaputra_River_Guwahati.jpg/1280px-Brahmaputra_River_Guwahati.jpg',
  ],
  bhubaneswar: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Bhubaneswar_at_night_from_sky.jpg/1280px-Bhubaneswar_at_night_from_sky.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Lingaraj_Temple_Bhubaneswar.jpg/1280px-Lingaraj_Temple_Bhubaneswar.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Dhauli_Giri_Shanti_Stupa.jpg/1280px-Dhauli_Giri_Shanti_Stupa.jpg',
  ],
  kolkata: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Kolkata_maidan.jpg/1280px-Kolkata_maidan.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Victoria_Memorial_Kolkata.jpg/1280px-Victoria_Memorial_Kolkata.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Howrah_Bridge_at_night.jpg/1280px-Howrah_Bridge_at_night.jpg',
  ],
  chennai: [
    'https://upload.wikimedia.org/wikipedia/commons/3/32/Chennai_Central.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Marina_Beach_Chennai.jpg/1280px-Marina_Beach_Chennai.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Kapaleeshwarar_Temple_Mylapore_Chennai.jpg/1280px-Kapaleeshwarar_Temple_Mylapore_Chennai.jpg',
  ],
  jaipur: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/1280px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Amber_Fort_Jaipur.jpg/1280px-Amber_Fort_Jaipur.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Jal_Mahal_Jaipur.jpg/1280px-Jal_Mahal_Jaipur.jpg',
  ],
  shimla: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Landscape_of_Shimla_%2C_Himachal_Pradesh.jpg/1280px-Landscape_of_Shimla_%2C_Himachal_Pradesh.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Christ_Church%2C_Shimla_01.jpg/1280px-Christ_Church%2C_Shimla_01.jpg',
  ],
  dehradun: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Dehradun_view_from_maggi_point.jpg/1280px-Dehradun_view_from_maggi_point.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Forest_Research_Institute%2C_Dehradun.jpg/1280px-Forest_Research_Institute%2C_Dehradun.jpg',
  ],
  kochi: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Chinese_fishing_nets_Kochi.jpg/1280px-Chinese_fishing_nets_Kochi.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Marine_Drive_Kochi_skyline.jpg/1280px-Marine_Drive_Kochi_skyline.jpg',
  ],
  hyderabad: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad_1.jpg/1280px-Charminar_Hyderabad_1.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Golconda_Fort_Hyderabad.jpg/1280px-Golconda_Fort_Hyderabad.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Hussain_Sagar_Buddha_Statue_Hyderabad.jpg/1280px-Hussain_Sagar_Buddha_Statue_Hyderabad.jpg',
  ],
};

function normalizeName(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawCity = searchParams.get('city') || searchParams.get('query') || '';
  const rawParentCity = searchParams.get('parentCity') || searchParams.get('parent_city') || '';
  const rawState = searchParams.get('state') || '';

  // Clean city & parent city names (strip coordinates, distance notes, postal codes)
  const cleanCity = rawCity
    .replace(/^[\d\s\w\.\-]+of\s+/i, '')
    .replace(/[\(\)]/g, '')
    .split(',')[0]
    .replace(/District/i, '')
    .trim();

  const cleanParentCity = rawParentCity
    .replace(/^[\d\s\w\.\-]+of\s+/i, '')
    .replace(/[\(\)]/g, '')
    .split(',')[0]
    .replace(/District/i, '')
    .trim();

  const cleanState = rawState.split(',')[0].trim();
  const primarySearchCity = cleanParentCity || cleanCity || 'City';

  const cacheKey = `${primarySearchCity.toLowerCase()}_${cleanState.toLowerCase()}`;
  const now = Date.now();
  const cached = MEMORY_CACHE.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  // 1. Check curated high-res photos first for instant guaranteed response
  const normKey = normalizeName(primarySearchCity);
  let matchedCurated = CURATED_CITY_PHOTOS[normKey];
  if (!matchedCurated && cleanCity) {
    matchedCurated = CURATED_CITY_PHOTOS[normalizeName(cleanCity)];
  }
  if (!matchedCurated) {
    for (const [k, photos] of Object.entries(CURATED_CITY_PHOTOS)) {
      if (normKey.includes(k) || k.includes(normKey)) {
        matchedCurated = photos;
        break;
      }
    }
  }

  const collectedPhotos: string[] = matchedCurated ? [...matchedCurated] : [];
  let pageTitle = primarySearchCity;
  let pageSummary = '';

  // 2. Fetch authentic Wikipedia Photography & Summary with Required User-Agent Header
  const queryVariants = [
    cleanState ? `${primarySearchCity}, ${cleanState}` : '',
    primarySearchCity,
    cleanParentCity && cleanCity && cleanParentCity !== cleanCity ? `${cleanCity}, ${cleanParentCity}` : '',
    cleanCity !== primarySearchCity ? cleanCity : '',
    `${primarySearchCity} district`,
    `${primarySearchCity} (city)`,
  ].filter(Boolean);

  const headers = {
    'User-Agent': 'AapdaSetu/2.0 (contact@aapdasetu.org; https://aapdasetu.org) Node.js',
    'Accept': 'application/json',
  };

  for (const q of queryVariants) {
    try {
      const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&redirects=1&prop=pageimages|extracts|images&exintro=1&explaintext=1&exsentences=3&pithumbsize=1200&imlimit=25&format=json`;
      const res = await fetch(summaryUrl, { headers, signal: AbortSignal.timeout(4500) });
      if (!res.ok) continue;

      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {}) as any[];
      const page = pages[0];

      if (page && page.pageid > 0) {
        pageTitle = page.title || pageTitle;
        pageSummary = page.extract || pageSummary;

        if (page.thumbnail?.source && !collectedPhotos.includes(page.thumbnail.source)) {
          collectedPhotos.unshift(page.thumbnail.source);
        }

        // Fetch additional photo URLs from the page's images
        if (page.images && page.images.length > 0) {
          const imageTitles = page.images
            .map((img: any) => img.title as string)
            .filter((t: string) => {
              const lower = (t || '').toLowerCase();
              return (
                !lower.includes('icon') &&
                !lower.includes('logo') &&
                !lower.includes('flag') &&
                !lower.includes('stub') &&
                !lower.includes('map') &&
                !lower.includes('seal') &&
                !lower.includes('symbol') &&
                !lower.includes('diagram') &&
                !lower.includes('coat_of_arms') &&
                /\.(jpe?g|png)/i.test(lower)
              );
            })
            .slice(0, 10);

          if (imageTitles.length > 0) {
            const imgInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(imageTitles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json`;
            const ir = await fetch(imgInfoUrl, { headers, signal: AbortSignal.timeout(3500) }).then((r) => r.json()).catch(() => null);
            const imgPages = Object.values(ir?.query?.pages || {}) as any[];
            for (const ip of imgPages) {
              const u = ip.imageinfo?.[0]?.thumburl || ip.imageinfo?.[0]?.url;
              if (u && !collectedPhotos.includes(u) && !u.includes('.svg')) {
                collectedPhotos.push(u);
              }
              if (collectedPhotos.length >= 6) break;
            }
          }
        }

        if (collectedPhotos.length > 0) {
          break;
        }
      }
    } catch {
      // Continue
    }
  }

  // 3. Fallback: Search generator if still zero photos
  if (collectedPhotos.length === 0) {
    try {
      const genUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanCity + ' city')}&gsrlimit=1&prop=pageimages|extracts&exintro=1&explaintext=1&exsentences=3&pithumbsize=1200&format=json`;
      const gRes = await fetch(genUrl, { headers, signal: AbortSignal.timeout(4000) });
      if (gRes.ok) {
        const gData = await gRes.json();
        const gPage = Object.values(gData?.query?.pages || {})[0] as any;
        if (gPage?.thumbnail?.source) {
          collectedPhotos.push(gPage.thumbnail.source);
          pageSummary = gPage.extract || pageSummary;
          pageTitle = gPage.title || pageTitle;
        }
      }
    } catch {}
  }

  // 4. Clean and deduplicate photos
  const filteredPhotos = collectedPhotos.filter((url) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      !lower.includes('flood') &&
      !lower.includes('debris') &&
      !lower.includes('casualt') &&
      !lower.includes('disaster') &&
      !lower.includes('damage') &&
      !lower.includes('submerged')
    );
  });

  const finalResponse: PlaceImageResponse = {
    city: cleanCity,
    parentCity: cleanCity,
    state: cleanState || undefined,
    title: pageTitle,
    summary: pageSummary,
    photoUrl: filteredPhotos[0] || null,
    photoUrls: filteredPhotos.slice(0, 8),
  };

  MEMORY_CACHE.set(cacheKey, { data: finalResponse, timestamp: now });
  return NextResponse.json(finalResponse);
}
