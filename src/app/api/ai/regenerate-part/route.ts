import { NextRequest, NextResponse } from 'next/server';

const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-pro-latest',
  'gemini-1.5-flash'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      part = 'subject', // 'subject' | 'body'
      stepIndex = 0,
      currentStep,
      roughSketch,
      offer,
      audience,
      angle = 'value_teardown',
      csvVariables = ['First_Name', 'Company', 'Title', 'City', 'Website', 'Icebreaker', 'Pitch_Page_URL'],
      provider = 'gemini',
      geminiKey,
      openaiKey,
      deepseekKey
    } = body;

    let effectiveProvider: 'gemini' | 'openai' | 'deepseek' = 'gemini';
    let effectiveKey = '';

    const directGeminiKey = geminiKey?.trim() || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    const directOpenAiKey = openaiKey?.trim() || '';
    const directDeepseekKey = deepseekKey?.trim() || '';

    if (provider === 'openai' && directOpenAiKey) {
      effectiveProvider = 'openai';
      effectiveKey = directOpenAiKey;
    } else if (provider === 'deepseek' && directDeepseekKey) {
      effectiveProvider = 'deepseek';
      effectiveKey = directDeepseekKey;
    } else if (directGeminiKey) {
      effectiveProvider = 'gemini';
      effectiveKey = directGeminiKey;
    } else if (directOpenAiKey) {
      effectiveProvider = 'openai';
      effectiveKey = directOpenAiKey;
    } else if (directDeepseekKey) {
      effectiveProvider = 'deepseek';
      effectiveKey = directDeepseekKey;
    }

    if (!effectiveKey) {
      return NextResponse.json({ error: 'AI API Key Required in Settings', missingKey: true }, { status: 400 });
    }

    const availableTagsList = Array.from(new Set(['First_Name', 'Company', 'Pitch_Page_URL', ...csvVariables])).map(t => `{{${t}}}`).join(', ');
    const isSubject = part === 'subject';
    const isStep1 = stepIndex === 0;

    let systemPrompt = '';
    let userPrompt = `Business Context / User Brief: "${roughSketch || offer || 'B2B Growth Service'}"
Target Avatar: ${audience || 'commercial decision maker'}
Current Email Step: Step ${stepIndex + 1} (${isStep1 ? 'Initial Touch' : 'Threaded Follow-up'})
Existing Subject: "${currentStep?.subject || ''}"
Existing Body: "${currentStep?.body || ''}"`;

    if (isSubject) {
      systemPrompt = `You are an elite cold email copywriter. Generate a FRESH, HIGH-CONVERTING SPINTAX SUBJECT LINE for this email step.
Rules:
1. Wrap in {Option 1|Option 2|Option 3} Spintax format (2-3 distinct angles).
2. Tailor specifically to the industry/service in the user's brief.
3. ${!isStep1 ? 'Prepend with "Re: " since this is a follow-up step.' : 'Keep it under 6 words, low-friction, curiosity-driven.'}
4. Weave in {{Company}} where appropriate.
Return ONLY valid JSON: { "subject": "..." }`;
    } else {
      systemPrompt = `You are an elite cold email copywriter trained on Alex Hormozi's $100M Offers.
Generate a FRESH, HIGH-CONVERTING COLD EMAIL BODY for this email step.
Rules:
1. Word count strictly ${isStep1 ? 'UNDER 50 words' : 'UNDER 35 words'}.
2. 3rd-grade reading level. Zero corporate pleasantries ("hope you are well").
3. Use realistic domain value asset (e.g. rate card, benchmark, audit).
4. Wrap greetings in {Hi|Hey} {{First_Name}} Spintax.
5. End with 1 single low-pressure permission question.
6. Available merge tags: ${availableTagsList}.
Return ONLY valid JSON: { "body": "..." }`;
    }

    let generatedResult: any = {};

    // 1. CALL GEMINI
    if (effectiveProvider === 'gemini') {
      let lastErr = '';
      for (const model of GEMINI_MODELS) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
            }),
            signal: AbortSignal.timeout(9000)
          });

          if (res.ok) {
            const data = await res.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) {
              generatedResult = JSON.parse(raw);
              break;
            }
          }
        } catch (e: any) {
          lastErr = e.message;
        }
      }
    }

    // 2. CALL OPENAI
    else if (effectiveProvider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.9
        }),
        signal: AbortSignal.timeout(9000)
      });
      if (res.ok) {
        const data = await res.json();
        generatedResult = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      }
    }

    // 3. CALL DEEPSEEK
    else if (effectiveProvider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${effectiveKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.9
        }),
        signal: AbortSignal.timeout(9000)
      });
      if (res.ok) {
        const data = await res.json();
        generatedResult = JSON.parse(data.choices?.[0]?.message?.content || '{}');
      }
    }

    return NextResponse.json({
      success: true,
      part,
      subject: generatedResult.subject,
      body: generatedResult.body
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to regenerate part' }, { status: 500 });
  }
}
