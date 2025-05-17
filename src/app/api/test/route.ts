import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const {
    prompt,
    model,
    temperature,
    top_p,
    max_tokens,
    systemPrompt,
    providerSettings
  } = await req.json();

  if (!providerSettings || !providerSettings.provider) {
    return NextResponse.json({ error: 'No provider settings supplied.' }, { status: 400 });
  }

  const messages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    { role: 'user', content: prompt }
  ];

  const body = JSON.stringify({
    model,
    messages,
    temperature,
    top_p,
    max_tokens,
    stream: false
  });

  let apiRes;
  const start = Date.now();
  try {
    if (providerSettings.provider === 'openrouter') {
      apiRes = await fetch(providerSettings.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${providerSettings.apiKey}`
        },
        body
      });
    } else if (providerSettings.provider === 'lmstudio') {
      apiRes = await fetch(providerSettings.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
    } else {
      return NextResponse.json({ error: 'Unknown provider.' }, { status: 400 });
    }
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return NextResponse.json({ error: errText }, { status: 500 });
    }
    const data = await apiRes.json();
    const latency = Date.now() - start;
    const content = data.choices?.[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || null;
    return NextResponse.json({ output: content, tokens, latency });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
} 