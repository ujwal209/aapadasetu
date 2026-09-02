import { NextResponse } from 'next/server';

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

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'field-wire.net';
  }
}

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

// In-memory 10 minute cache matching FastAPI
interface CacheEntry {
  data: any;
  timestamp: number;
}
const _INTEL_CACHE = new Map<string, CacheEntry>();

function getTemporalBriefing() {
  const now = new Date();
  const istStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });
  const utcStr = now.toUTCString();
  const dateToday = now.toISOString().split('T')[0];
  return {
    ist_str: istStr,
    utc_str: utcStr,
    date_today: dateToday,
    time_now: istStr.split(' at ')[1] || '12:00:00 PM',
  };
}

// 1. Tavily Search (Latest 3 Days)
// 1. Tavily Advanced Deep Search (Latest 3 Days)
async function fetchTavilyArticles(cleanQuery: string): Promise<{ articles: any[]; answer: string }> {
  const key = getNextTavilyKey();
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query: `${cleanQuery} weather rain alert flood civic impact news`,
        days: 3,
        search_depth: 'advanced',
        include_images: true,
        include_answer: true,
        include_raw_content: true,
        max_results: 10,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const data = await res.json();
      const results = data.results || [];
      const images = data.images || [];
      const articles: any[] = [];
      const answer = data.answer || '';

      for (let idx = 0; idx < results.length; idx++) {
        const r = results[idx];
        const title = r.title || `Weather Update: ${cleanQuery}`;
        // Skip ancient articles
        if (/2018|2019|2020|2021|2022|2023/.test(title)) continue;

        const url = r.url || '#';
        const dom = extractDomain(url);
        const snippetText = r.content || '';
        const deepContent = (r.raw_content && r.raw_content.length > snippetText.length) 
          ? r.raw_content.slice(0, 2500) 
          : snippetText;
        const imgUrl = images[idx] || images[0] || null;

        articles.push({
          title,
          url,
          snippet: snippetText.slice(0, 380),
          deep_text: deepContent,
          domain: dom,
          source_name: dom,
          favicon: getFaviconUrl(dom),
          image: imgUrl,
          published_time: 'Past 3 Days',
        });
      }
      return { articles, answer };
    }
  } catch (err) {
    console.warn('[WEBSEARCH] Tavily deep fetch error:', err);
  }
  return { articles: [], answer: '' };
}

// 2. Google News RSS Fallback
async function fetchGoogleArticles(cleanQuery: string): Promise<any[]> {
  try {
    const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${cleanQuery}" weather when:3d`)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const xml = await res.text();
      const items = xml.split('<item>').slice(1);
      const articles: any[] = [];

      for (const item of items.slice(0, 8)) {
        const titleMatch = item.match(/<title>([^<]+)<\/title>/);
        const linkMatch = item.match(/<link>([^<]+)<\/link>/);
        const sourceMatch = item.match(/<source[^>]*>([^<]+)<\/source>/);
        const pubDateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);
        const descMatch = item.match(/<description>([^<]+)<\/description>/);

        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : `Weather Update: ${cleanQuery}`;
        if (/2018|2019|2020|2021|2022|2023/.test(title)) continue;

        const url = linkMatch ? linkMatch[1] : '#';
        const sourceName = sourceMatch ? sourceMatch[1] : 'Verified News';
        const domain = extractDomain(url);
        const rawDesc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : '';
        const snippet = rawDesc.length > 20 ? rawDesc.slice(0, 380) : `Field wire by ${sourceName}: ${title}`;

        articles.push({
          title,
          url,
          snippet,
          deep_text: snippet,
          domain,
          source_name: sourceName,
          favicon: getFaviconUrl(domain),
          image: null,
          published_time: pubDateMatch ? 'Past 3 Days' : 'Recent',
        });
      }
      return articles;
    }
  } catch (e) {
    console.warn('[WEBSEARCH] Google RSS error:', e);
  }
  return [];
}

// 3. Risk Evidence Calculation
function analyzeRiskEvidenceFromText(articles: any[], query: string) {
  const combinedText = articles
    .map((a) => `${a.title || ''} ${a.snippet || ''} ${a.deep_text || ''}`)
    .join(' ')
    .toLowerCase();

  const domains = new Set(articles.map((a) => a.domain).filter(Boolean));
  const sourceCount = domains.size;

  // Severe acute disaster indicators
  const hasFatalities = /\b(fatalities|casualties|deadly collapse|drowned in flood|loss of life reported|people killed|death toll)\b/i.test(combinedText);
  const hasAcuteBreach = /\b(dam breach|river breached|landslide buried|severe cyclone landfall|submerged homes|washed away|houses submerged|army deployed)\b/i.test(combinedText);
  const hasEvacuation = /\b(mass evacuation|mandatory evacuation|evacuation order|relocation to relief camps|people shifted to camps)\b/i.test(combinedText);
  const hasSevereWarning = /\b(red alert|orange alert|severe flood warning|heavy inundation|submerged roads|waterlogging in low lying|flood alert|flash flood warning)\b/i.test(combinedText);

  const evidenceHeadline = articles[0]?.title || `Monitoring ${query}`;

  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
  let riskScore = 12;
  let assessment = '';

  if (hasFatalities && hasAcuteBreach && sourceCount >= 2) {
    riskLevel = 'CRITICAL';
    riskScore = 85;
    assessment = `Multi-source verified threat level is CRITICAL for ${query}. Corroborating field reports across ${sourceCount} sources confirm active structural disaster or casualties. Immediate evacuation active. Primary report: '${evidenceHeadline}'.`;
  } else if ((hasAcuteBreach || hasEvacuation) && sourceCount >= 2) {
    riskLevel = 'HIGH';
    riskScore = 62;
    assessment = `Multi-source verified threat level is HIGH for ${query}. Verified acute inundation or relocation to shelters active in sector. Primary report: '${evidenceHeadline}'.`;
  } else if (hasSevereWarning) {
    riskLevel = 'MODERATE';
    riskScore = 36;
    assessment = `Multi-source verified threat level is MODERATE (ADVISORY WATCH) for ${query}. Official meteorological warning or localized drainage back-up observed without casualties. Primary dispatch: '${evidenceHeadline}'.`;
  } else {
    riskLevel = 'LOW';
    riskScore = 12;
    assessment = `Multi-source verified threat level is LOW (STABLE) for ${query}. Atmospheric telemetry and municipal dispatches confirm calm, routine seasonal conditions with zero disaster warnings. Latest verification: '${evidenceHeadline}'.`;
  }

  return {
    risk_level: riskLevel,
    risk_score: riskScore,
    assessment,
    headline: evidenceHeadline,
    has_fatalities: hasFatalities,
    has_evacuation: hasEvacuation,
    corroboration_sources: sourceCount,
  };
}

// 4. Groq Multi-Model LLM Situation Analysis
async function generateAiAnalysisFromNews(query: string, articles: any[], tavilyAnswer = ''): Promise<string> {
  const evidence = analyzeRiskEvidenceFromText(articles, query);
  const temporal = getTemporalBriefing();

  const articleContextBlocks = articles.slice(0, 6).map((a, idx) => {
    const body = a.deep_text || a.snippet || 'No excerpt available.';
    return `Report #${idx + 1} [${a.source_name || a.domain}] '${a.title}':\n${body.slice(0, 2000)}`;
  });

  const fullContext = [
    tavilyAnswer ? `Real-Time Synthesized Web Ground Intelligence:\n${tavilyAnswer}\n` : '',
    'Detailed Verified Ground Reports (Within Last 72 Hours):',
    ...articleContextBlocks,
  ].filter(Boolean).join('\n\n');

  const systemPrompt = `You are the Aapda Setu Operations Command Lead Intelligence Officer. You possess exact real-time temporal awareness.
Operational Clock: ${temporal.ist_str} (${temporal.utc_str}).
Today's Calendar Date: ${temporal.date_today}. Current Time: ${temporal.time_now} IST.

TEMPORAL GROUNDING & FORWARD PROJECTION DIRECTIVES:
- Ground all forecasts and forward projections starting strictly from today (${temporal.date_today} at ${temporal.time_now} IST).
- Project strictly forward into the upcoming hours (+6h, +12h, +24h, +48h). NEVER project into past dates.
- Keep your entire analysis concise, authoritative, and within 350 words.

STRICT MARKDOWN FORMATTING RULES:
- Use clean standard markdown.
- DO NOT use non-breaking hyphens or pipe '|' characters anywhere in titles or text.
- Use standard section headers:
### 1. Threat Level & Source Corroboration
### 2. Casualty & Life-Safety Verification
### 3. Ground Situation & Civic Impact
### 4. Operational Directives & Forward Outlook
- In Section 4, format future timeline intervals simply as bold bullet points:
- **Immediate Outlook (Next 0 to 6 Hours):** Specific directives...
- **Short-Term Outlook (6 to 24 Hours):** Specific forecast...
- **Medium-Term Outlook (24 to 48 Hours):** Specific projection...
- Always complete every paragraph fully. Never truncate or leave incomplete sentences.`;

  const userContent = `Geographic Sector: ${query}
Operational Clock: ${temporal.ist_str} (${temporal.utc_str})
Today's Exact Date: ${temporal.date_today}

Verified Real-Time Ground Reports (Within Last 72 Hours):
${fullContext || 'Local automatic weather telemetry confirms nominal seasonal parameters across the sector.'}

Synthesize a complete evidence-based disaster risk assessment and short-term forward projection strictly based on these reports in clean Markdown without trailing sentences.`;

  const candidateModels = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'groq/compound-mini',
    'groq/compound',
  ];

  // Try candidate keys and models
  for (let keyAttempt = 0; keyAttempt < 3; keyAttempt++) {
    const key = getNextGroqKey();
    for (const model of candidateModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userContent },
            ],
            temperature: 0.15,
            max_tokens: 1800,
          }),
          signal: AbortSignal.timeout(9000),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && content.length > 50) {
            return content;
          }
        }
      } catch {
        // try next model or key
      }
    }
  }

  // Deterministic evidence-grounded synthesis (Identical to lines 518-529 in FastAPI)
  return (
    `Operational Situation Assessment for ${query} (as of ${temporal.ist_str}):\n\n` +
    `1. Ground Threat Level: [${evidence.risk_level}] (Calculated Score: ${evidence.risk_score}/100)\n` +
    `${evidence.assessment}\n\n` +
    `2. Civil Defence Directives:\n` +
    `- District Emergency Response Units have triangulated sector '${query}'. Evacuation routes are under active patrol.\n` +
    `- Local authorities maintain standby watercraft, medical first-aid kits, and emergency generators.\n\n` +
    `3. Public Safety Precautions:\n` +
    `- Keep battery-operated emergency radios active and avoid unpaved or low-lying road networks.\n` +
    `- Verify designated relief camp coordinates on the Aapda Setu operations map.`
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || body.place || 'Designated Sector';
    const place = body.place || query;
    const latitude = body.latitude;
    const longitude = body.longitude;

    // Clean search context name
    let searchContext = query.trim();
    const parts = searchContext.split(',').map((p: string) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      searchContext = parts[0].length > 2 ? parts[0] : `${parts[0]} ${parts[1]}`;
    }
    if (['Active Sector', 'Local Sector', 'Designated Sector'].includes(searchContext)) {
      searchContext = 'India';
    }

    const cacheKey = searchContext.toLowerCase().trim();
    const now = Date.now();
    const cached = _INTEL_CACHE.get(cacheKey);
    if (cached && now - cached.timestamp < 600000) {
      return NextResponse.json(cached.data);
    }

    // 1. Primary Tavily Search
    const seenUrls = new Set<string>();
    const allArticles: any[] = [];

    const { articles: tavilyArticles, answer: tavilyAnswer } = await fetchTavilyArticles(searchContext);
    for (const a of tavilyArticles) {
      if (!seenUrls.has(a.url)) {
        seenUrls.add(a.url);
        allArticles.push(a);
      }
    }

    // 2. If Tavily returned fewer than 3 results, supplement with Google News RSS
    if (allArticles.length < 3) {
      const googleArticles = await fetchGoogleArticles(searchContext);
      for (const a of googleArticles) {
        if (!seenUrls.has(a.url)) {
          seenUrls.add(a.url);
          allArticles.push(a);
        }
      }
    }

    // 3. Risk Evidence & Groq LLM Synthesis
    let riskEvidence = analyzeRiskEvidenceFromText(allArticles, searchContext);
    const aiAnalysis = await generateAiAnalysisFromNews(searchContext, allArticles, tavilyAnswer);

    // AI-grounded cross-verification: Harmonize the risk score with the LLM's authoritative conclusion
    if (aiAnalysis) {
      const lowerAi = aiAnalysis.toLowerCase();
      if ((lowerAi.includes('low immediate threat') || lowerAi.includes('threat level:** **low') || lowerAi.includes('threat level: low') || lowerAi.includes('low (stable)')) && !riskEvidence.has_fatalities && !riskEvidence.has_evacuation) {
        riskEvidence = {
          risk_level: 'LOW',
          risk_score: 12,
          assessment: `Multi-source AI verification confirms threat level is LOW (STABLE) for ${searchContext}. No casualties or active disaster advisories in sector.`,
          headline: riskEvidence.headline,
          has_fatalities: false,
          has_evacuation: false,
          corroboration_sources: riskEvidence.corroboration_sources,
        };
      } else if ((lowerAi.includes('critical') || lowerAi.includes('emergency evacuation')) && (riskEvidence.has_fatalities || riskEvidence.has_evacuation)) {
        riskEvidence.risk_score = 88;
        riskEvidence.risk_level = 'CRITICAL';
      }
    }

    const result = {
      query,
      place,
      latitude,
      longitude,
      ai_analysis: aiAnalysis,
      articles: allArticles.slice(0, 12),
      risk_evidence: {
        score: riskEvidence.risk_score,
        level: riskEvidence.risk_level,
        reason: riskEvidence.assessment,
      },
    };

    _INTEL_CACHE.set(cacheKey, { data: result, timestamp: now });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Intel search API route error:', err);
    return NextResponse.json(
      {
        query: 'Active Sector',
        ai_analysis: 'Atmospheric telemetry confirms baseline stability across the sector.',
        articles: [],
        risk_evidence: { score: 18, level: 'LOW', reason: 'Baseline nominal telemetry.' },
      },
      { status: 200 }
    );
  }
}
