import { NextResponse } from 'next/server';

function getGroqKeys(): string[] {
  const env = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  return env.split(',').map((k) => k.trim()).filter(Boolean);
}

let groqIdx = 0;
function getNextGroqKey(): string {
  const keys = getGroqKeys();
  if (keys.length === 0) return '';
  const k = keys[groqIdx % keys.length];
  groqIdx++;
  return k;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const location = body.location || 'Current Sector';

    const now = new Date();
    const istStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });
    const utcStr = now.toUTCString();

    const systemPrompt = `You are the Aapda Setu Field Intelligence Assistant.
Operational Clock: ${istStr} (${utcStr}).
Contextual Location / Coordinates: ${location}.
Provide authoritative, concise, and structured disaster management instructions and forward predictions anchored to the current date and time.
Never use emoticons. Prioritize human life, safe evacuation, and verified official directives.`;

    const groqMessages = [{ role: 'system', content: systemPrompt }];
    for (const m of messages.slice(-5)) {
      groqMessages.push({ role: m.role, content: m.content });
    }

    const candidateModels = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'groq/compound-mini',
      'groq/compound',
    ];

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
              messages: groqMessages,
              temperature: 0.2,
              max_tokens: 600,
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) {
              return NextResponse.json({
                response: text,
                reply: text,
                sources: [
                  {
                    title: 'National Disaster Management Authority (NDMA)',
                    url: 'https://ndma.gov.in',
                    snippet: 'Official emergency guidelines and evacuation standards.',
                    domain: 'ndma.gov.in',
                    favicon: 'https://www.google.com/s2/favicons?domain=ndma.gov.in&sz=32',
                  },
                  {
                    title: 'USGS NEIC Earth Hazard Network',
                    url: 'https://earthquake.usgs.gov',
                    snippet: 'Real-time seismic and geodynamic alerts.',
                    domain: 'usgs.gov',
                    favicon: 'https://www.google.com/s2/favicons?domain=usgs.gov&sz=32',
                  },
                ],
              });
            }
          }
        } catch {}
      }
    }

    const lastMsg = messages[messages.length - 1]?.content || 'Disaster Safety';
    const fallbackText = `Civil Defence Protocol regarding "${lastMsg}":\n\n` +
      `1. Move immediately away from unreinforced masonry and water-logging zones.\n` +
      `2. Disconnect domestic power circuits and gas cylinders before evacuation.\n` +
      `3. Keep battery-operated radios tuned to civil defence frequencies and proceed to designated relief shelters.`;

    return NextResponse.json({
      response: fallbackText,
      reply: fallbackText,
      sources: [
        {
          title: 'National Disaster Management Authority (NDMA)',
          url: 'https://ndma.gov.in',
          snippet: 'Official emergency guidelines and evacuation standards.',
          domain: 'ndma.gov.in',
          favicon: 'https://www.google.com/s2/favicons?domain=ndma.gov.in&sz=32',
        },
      ],
    });
  } catch (e: any) {
    return NextResponse.json({
      response: 'Disaster Operations Center active. Follow official evacuation directives.',
      reply: 'Disaster Operations Center active. Follow official evacuation directives.',
      sources: [],
    });
  }
}
