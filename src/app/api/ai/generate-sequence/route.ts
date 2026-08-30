import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpamRisk } from '@/lib/spamWords';
import { SequenceStep } from '@/lib/types';

interface GenerateRequest {
  roughSketch?: string;
  offer?: string;
  audience?: string;
  painPoint?: string;
  leadMagnet?: string;
  cta?: string;
  angle?: 'value_teardown' | 'case_study_proof' | '3_sentence_hook' | string;
  framework?: string;
  csvVariables?: string[];
  apiKey?: string;
  provider?: 'gemini' | 'openai' | 'deepseek' | string;
  geminiKey?: string;
  openaiKey?: string;
  deepseekKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { 
      roughSketch,
      offer, 
      audience, 
      painPoint, 
      leadMagnet, 
      cta, 
      angle,
      framework = 'value_teardown', 
      csvVariables = ['First_Name', 'Company', 'Title', 'City', 'Website', 'Icebreaker', 'Pitch_Page_URL'],
      apiKey,
      provider = 'gemini',
      geminiKey,
      openaiKey,
      deepseekKey
    } = body;

    const selectedAngle = angle || framework || 'value_teardown';
    const targetAudience = audience?.trim() || 'target prospect';
    const targetOffer = offer?.trim() || '';
    const targetPain = painPoint?.trim() || '';
    const targetMagnet = leadMagnet?.trim() || 'a 60-second video teardown / pitch page ({{Pitch_Page_URL}})';
    const targetCta = cta?.trim() || 'Worth a quick look?';

    // Determine the active API key and provider
    let effectiveProvider: 'gemini' | 'openai' | 'deepseek' = 'gemini';
    let effectiveKey = '';

    const directGeminiKey = geminiKey?.trim() || apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
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

    // STRICT REQUIREMENT: If no key is configured, do not fake or hardcode copy. Inform user clearly.
    if (!effectiveKey) {
      return NextResponse.json(
        { 
          error: 'No AI API Key Found. Please connect your Google Gemini (Free), OpenAI, or DeepSeek API key in Settings (or use the "Write Your Own Message" tab).',
          missingKey: true
        }, 
        { status: 400 }
      );
    }

    // Available Dynamic CSV tags from prospect lead list
    const availableTagsList = Array.from(new Set(['First_Name', 'Company', 'Pitch_Page_URL', ...csvVariables])).map(t => `{{${t}}}`).join(', ');

    const systemPrompt = `You are an elite autonomous cold outbound sequence engine trained on Alex Hormozi's $100M Offers, $100M Leads, and Aaron Ross's Predictable Revenue.

You operate via a strict 3-Stage Internal Pipeline:

🧠 STAGE 1: INTENT & COMMERCIAL BUYER DISCOVERY
- Classify the user's business, service, or product from their brief.
- Identify the highest-ROI B2B decision-maker who actually hires/buys this service over email:
  * Local/Trade Services (AC/HVAC, Roofing, Cleaning, Electrical): Target Commercial Property Managers, Facility Ops Directors, Retail/Restaurant Building Managers.
  * B2B SaaS / Tech: Target Founders, CTOs, Growth Leaders.
  * Health / MedSpa / Dental: Target Practice Owners, Managing Partners, Clinic Directors.
  * Agencies / Studios: Target Agency Founders, Marketing Directors.
- Generate industry-specific Spintax subject lines (e.g. for AC: "{Quick question|Brief inquiry} re: {{Company}}'s HVAC units" or "HVAC maintenance idea for {{Company}}").

✍️ STAGE 2: VALUE-FIRST 3-TOUCH SYNTHESIS
- Touch 1 (Day 1 - Initial): 1-sentence observation + Dream Outcome + Free Value Asset (${targetMagnet}) + 1-Question Low-Friction CTA (e.g. "${targetCta}").
- Touch 2 (Day 3 - Threaded Follow-up): Starts with "Re: [Subject]" + specific case study proof point with concrete metrics.
- Touch 3 (Day 7 - Graceful Breakup): Starts with "Re: [Subject]" + low-pressure polite closing (leaving door open).
- Naturally integrate merge variables from: ${availableTagsList}. Always format name tag as {{First_Name}} (with underscore) and company tag as {{Company}}.

⚖️ STAGE 3: AUTONOMOUS QUALITY JUDGE & ANTI-SLOP AUDIT
- Word Count Audit: Touch 1 strictly UNDER 50 words. Touch 2 strictly UNDER 40 words. Touch 3 strictly UNDER 30 words.
- Reading Level Audit: Simple 3rd-to-4th grade vocabulary. Short conversational sentences.
- Slop Ban: Zero pleasantries ("Hope this finds you well", "In today's fast-paced world", "revolutionary", "synergy").
- Spelling & Grammar Guarantee: Self-correct all spelling mistakes and typos (e.g. write "summer" instead of "sumner").
- Anti-Burn Spintax: Wrap greetings and phrases in {Option 1|Option 2|Option 3} format.
- Tag Consistency: Strictly use {{First_Name}} (not {{FirstName}}) and {{Company}}.

Selected Strategy Angle: ${selectedAngle}

OUTPUT FORMAT: Return ONLY valid JSON matching this schema:
{
  "steps": [
    { "id": 1, "day": 1, "type": "initial", "title": "Step 1: Value Hook & Free Gift", "subject": "{Niche question|Brief inquiry} re: {{Company}}", "body": "..." },
    { "id": 2, "day": 3, "type": "followup", "title": "Step 2: Proof & Case Study", "subject": "Re: {Niche question|Brief inquiry} re: {{Company}}", "body": "..." },
    { "id": 3, "day": 7, "type": "breakup", "title": "Step 3: Polite Breakup", "subject": "Re: {Niche question|Brief inquiry} re: {{Company}}", "body": "..." }
  ]
}`;

    const userPrompt = roughSketch?.trim() 
      ? `User's Rough Sketch & Pitch Brief:
"${roughSketch.trim()}"

Analyze what they do, who they target, and their service/offer from the brief above, and synthesize a high-converting cold email sequence following the selected angle: ${selectedAngle}.
Asset Link: ${targetMagnet}
CTA: ${targetCta}`
      : `Target Avatar: ${targetAudience}
Grand Slam Dream Outcome: ${targetOffer || 'help them scale with zero overhead'}
Core Problem Solved: ${targetPain || 'wasting time on low-converting methods'}
Lead Magnet / Free Asset: ${targetMagnet}
CTA: ${targetCta}
Framework Strategy: ${selectedAngle}`;

    let rawJsonText = '';

    // PROVIDER 1: Google Gemini (Resilient Model Fallback Chain)
    if (effectiveProvider === 'gemini') {
      const geminiModels = [
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-pro-latest',
        'gemini-1.5-flash'
      ];

      let lastErr = '';
      for (const model of geminiModels) {
        try {
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7
              }
            })
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawJsonText) break;
          } else {
            const errData = await geminiRes.json().catch(() => ({}));
            lastErr = errData.error?.message || `Google Gemini API error (Status ${geminiRes.status})`;
            if (geminiRes.status === 400 && lastErr.includes('API_KEY_INVALID')) {
              break;
            }
          }
        } catch (err: any) {
          lastErr = err.message || 'Gemini connection failed';
        }
      }

      if (!rawJsonText) {
        return NextResponse.json({ error: lastErr || 'Google Gemini API request failed.', provider: 'gemini' }, { status: 400 });
      }
    }

    // PROVIDER 2: OpenAI (gpt-4o-mini)
    else if (effectiveProvider === 'openai') {
      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        })
      });

      if (!openAiRes.ok) {
        const errData = await openAiRes.json().catch(() => ({}));
        const errMsg = errData.error?.message || `OpenAI API error (Status ${openAiRes.status})`;
        return NextResponse.json({ error: errMsg, provider: 'openai' }, { status: 400 });
      }

      const openAiData = await openAiRes.json();
      rawJsonText = openAiData.choices?.[0]?.message?.content || '';
    }

    // PROVIDER 3: DeepSeek (deepseek-chat)
    else if (effectiveProvider === 'deepseek') {
      const deepseekRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7
        })
      });

      if (!deepseekRes.ok) {
        const errData = await deepseekRes.json().catch(() => ({}));
        const errMsg = errData.error?.message || `DeepSeek API error (Status ${deepseekRes.status})`;
        return NextResponse.json({ error: errMsg, provider: 'deepseek' }, { status: 400 });
      }

      const deepseekData = await deepseekRes.json();
      rawJsonText = deepseekData.choices?.[0]?.message?.content || '';
    }

    if (!rawJsonText) {
      return NextResponse.json({ error: 'Failed to receive a valid response from the AI model.' }, { status: 500 });
    }

    const parsed = JSON.parse(rawJsonText);
    if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      return NextResponse.json({ error: 'AI model returned an unexpected response format.' }, { status: 500 });
    }

    const generatedSequence = parsed.steps.map((s: SequenceStep, idx: number) => {
      const fullText = `${s.subject} ${s.body}`;
      const spamAnalysis = analyzeSpamRisk(fullText);
      const stepType: 'initial' | 'followup' | 'nudge' | 'breakup' =
        s.type === 'initial' || s.type === 'followup' || s.type === 'nudge' || s.type === 'breakup'
          ? s.type
          : idx === 0 ? 'initial' : idx === 1 ? 'followup' : 'breakup';

      return {
        id: idx + 1,
        day: s.day || (idx === 0 ? 1 : idx === 1 ? 3 : 7),
        type: stepType,
        title: s.title || `Step ${idx + 1}`,
        subject: s.subject,
        body: s.body,
        spamScore: spamAnalysis.score,
        spamWordsFound: spamAnalysis.wordsFound
      };
    });

    return NextResponse.json({
      success: true,
      sequence: generatedSequence,
      provider: effectiveProvider
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate sequence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
