import { NextRequest, NextResponse } from 'next/server';

function extractFirstJson(str: string) {
  const match = str.match(/\{[\s\S]*\}/);
  if (match) {
    return JSON.parse(match[0]);
  }
  throw new Error('No JSON found in response');
}

export async function POST(req: NextRequest) {
  const { prompt, providerSettings } = await req.json();
  if (!providerSettings || !providerSettings.provider) {
    return NextResponse.json({ error: 'No provider settings supplied.' }, { status: 400 });
  }

  // Compose the LLM prompt for critique & improvement
  const systemPrompt = `You are an expert prompt engineer. Given a user prompt, do the following:\n\n1. List 3 weaknesses or areas for improvement.\n2. Rewrite the prompt to be clearer, more effective, and context-rich.\n\nRespond in JSON:\n{ "weaknesses": ["..."], "improved": "..." }`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const body = JSON.stringify({
    model: providerSettings.model,
    messages,
    stream: false
  });

  let apiRes;
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
    // Try to extract and parse the first JSON object from the model's response
    let critique;
    try {
      const content = data.choices?.[0]?.message?.content || '';
      critique = extractFirstJson(content);
    } catch {
      critique = { weaknesses: ['Could not parse critique.'], improved: '' };
    }
    return NextResponse.json(critique);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
} 