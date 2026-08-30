import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpamRisk } from '@/lib/spamWords';
import { SequenceStep } from '@/lib/types';

interface GenerateRequest {
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
    const targetAudience = audience?.trim() || 'B2B founders & growth leaders';
    const targetOffer = offer?.trim() || 'guaranteed 99% cold email primary inbox deliverability';
    const targetPain = painPoint?.trim() || 'emails landing in spam and burned domain reputations';
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
    const availableTagsList = Array.from(new Set(['First_Name', 'Company', 'Pitch_Page_URL', 'Icebreaker', ...csvVariables])).map(t => `{{${t}}}`).join(', ');

    const systemPrompt = `You are an elite cold email copywriter trained on Alex Hormozi's $100M Offers, $100M Leads, and Aaron Ross's Predictable Revenue.

STRICT COLD OUTREACH RULES:
1. THIRD-GRADE READING LEVEL: Simple, direct, conversational words. No fancy corporate jargon.
2. BREVITY: Touch 1 strictly UNDER 50 words. Touch 2 strictly UNDER 40 words. Touch 3 strictly UNDER 30 words.
3. BAN ALL PLEASANTRIES: Never use "I hope you are well", "In today's fast-paced world", "revolutionary", "synergy", "unlock", "game-changer".
4. VALUE-FIRST LEAD MAGNET: Deliver upfront value (${targetMagnet}) before asking for anything.
5. LOW-FRICTION 1-QUESTION CTA: End with 1 single low-pressure permission question (e.g. "${targetCta}").
6. CONTEXT-AWARE DYNAMIC CSV VARIABLES: Naturally weave in relevant tags where appropriate from: ${availableTagsList}.
7. DEEP SPINTAX: Wrap greetings and phrases with {Option 1|Option 2|Option 3} syntax for anti-burn deliverability.
8. TYPO & GRAMMAR REPAIR: Automatically fix any user typos, slang, or awkward phrases into natural professional English.
9. RETURN A 3-TOUCH SEQUENCE strictly in valid JSON format:
   - Touch 1 (Day 1): Observation + {{Icebreaker}} + Dream Outcome + Free Asset Link (${targetMagnet}) + 1-Question CTA.
   - Touch 2 (Day 3): Threaded follow-up starting with "Re:" + specific case study proof point.
   - Touch 3 (Day 7): Permission-based graceful breakup (leaving door open).

Selected Copywriting Angle: ${selectedAngle}

JSON Structure:
{
  "steps": [
    { "id": 1, "day": 1, "type": "initial", "title": "Step 1: Value Hook & Free Gift", "subject": "{Quick question|Brief inquiry} re: {{Company}}", "body": "..." },
    { "id": 2, "day": 3, "type": "followup", "title": "Step 2: Proof & Case Study", "subject": "Re: {Quick question|Brief inquiry} re: {{Company}}", "body": "..." },
    { "id": 3, "day": 7, "type": "breakup", "title": "Step 3: Polite Breakup", "subject": "Re: {Quick question|Brief inquiry} re: {{Company}}", "body": "..." }
  ]
}`;

    const userPrompt = `Target Avatar: ${targetAudience}
Grand Slam Dream Outcome: ${targetOffer}
Core Problem Solved: ${targetPain}
Lead Magnet / Free Asset: ${targetMagnet}
CTA: ${targetCta}
Framework Strategy: ${selectedAngle}`;

    let rawJsonText = '';

    // PROVIDER 1: Google Gemini 2.0 Flash
    if (effectiveProvider === 'gemini') {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${effectiveKey}`, {
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

      if (!geminiRes.ok) {
        const errData = await geminiRes.json().catch(() => ({}));
        const errMsg = errData.error?.message || `Google Gemini API error (Status ${geminiRes.status})`;
        return NextResponse.json({ error: errMsg, provider: 'gemini' }, { status: 400 });
      }

      const geminiData = await geminiRes.json();
      rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
