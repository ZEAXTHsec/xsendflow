import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpamRisk } from '@/lib/spamWords';
import { SequenceStep } from '@/lib/types';

interface GenerateRequest {
  offer?: string;
  audience?: string;
  painPoint?: string;
  leadMagnet?: string;
  cta?: string;
  framework?: 'seo_recovery' | 'web_dev_agency' | 'hormozi_grand_slam' | '3_sentence_hook' | 'video_pitch' | 'founder_intro' | 'case_study';
  apiKey?: string;
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
      framework = 'hormozi_grand_slam', 
      apiKey 
    } = body;

    const targetOffer = offer?.trim() || 'guaranteed 99% cold email primary inbox deliverability';
    const targetAudience = audience?.trim() || 'B2B founders & agency owners';
    const targetPain = painPoint?.trim() || 'emails landing in spam and burned domain reputations';
    const targetMagnet = leadMagnet?.trim() || 'a 60-second video teardown / pitch page ({{Pitch_Page_URL}})';
    const targetCta = cta?.trim() || 'Worth a quick look?';

    const effectiveApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    let generatedSequence: SequenceStep[] | null = null;

    // Try generating with Google Gemini 2.0 Flash with strict Hormozi & Cold Email Mastery rules
    if (effectiveApiKey) {
      try {
        const systemPrompt = `You are a cold email copywriter trained on Alex Hormozi's $100M Offers, $100M Leads, and Aaron Ross's Predictable Revenue.

STRICT COLD OUTREACH RULES:
1. THIRD-GRADE READING LEVEL: Simple, direct words. No fancy corporate jargon.
2. BREVITY: Touch 1 strictly UNDER 50 words. Touch 2 strictly UNDER 40 words. Touch 3 strictly UNDER 30 words.
3. BAN ALL PLEASANTRIES: Never use "I hope you are well", "In today's fast-paced world", "revolutionary", "synergy", "unlock".
4. VALUE-FIRST LEAD MAGNET: Deliver upfront value (${targetMagnet}) before asking for anything.
5. LOW-FRICTION 1-QUESTION CTA: End with 1 single low-pressure permission question (e.g. "${targetCta}").
6. MERGE TAGS PRESERVED: {{First_Name}}, {{Company}}, {{Pitch_Page_URL}}, {{Icebreaker}}, {{city}}, {{keyword}}.
7. DEEP SPINTAX: Wrap greetings and phrases with {Option 1|Option 2|Option 3} syntax.
8. RETURN 3-TOUCH SEQUENCE in JSON format:
   - Touch 1 (Day 1): Observation + {{Icebreaker}} + Dream Outcome + Free Asset Link (${targetMagnet}) + 1-Question CTA.
   - Touch 2 (Day 3): Threaded follow-up starting with "Re:" + specific case study proof point.
   - Touch 3 (Day 7): Permission-based graceful breakup (leaving door open).

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
Framework Strategy: ${framework}`;

        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${effectiveApiKey}`, {
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
              temperature: 0.6
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJsonText) {
            const parsed = JSON.parse(rawJsonText);
            if (Array.isArray(parsed.steps) && parsed.steps.length >= 2) {
              generatedSequence = parsed.steps.map((s: SequenceStep, idx: number) => {
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
            }
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local Hormozi framework:', err);
      }
    }

    // Fallback: 100% Battle-Tested Hormozi & Predictable Revenue Framework
    if (!generatedSequence) {
      if (framework === 'seo_recovery') {
        generatedSequence = [
          {
            id: 1,
            day: 1,
            type: 'initial' as const,
            title: 'Step 1: SEO Page-2 Opportunity',
            subject: '{Quick question|Brief inquiry} re: {{Company}} search rankings',
            body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\nNoticed {{Company}} is ranking on page 2 for high-intent commercial search terms in your space.\n\nPut together a 60-second video teardown showing 3 search ranking bottlenecks here: {{Pitch_Page_URL}}\n\n{{Worth a quick look?|Open to checking it out?}}\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          },
          {
            id: 2,
            day: 3,
            type: 'followup' as const,
            title: 'Step 2: Competitor Traffic Proof',
            subject: 'Re: {Quick question|Brief inquiry} re: {{Company}} search rankings',
            body: 'Hi {{First_Name}},\n\nQuick follow up on the SEO breakdown for {{Company}}. Recently helped a similar team capture 40% more organic inquiries in 30 days.\n\nDid you get a chance to review the 60s teardown?\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          },
          {
            id: 3,
            day: 7,
            type: 'breakup' as const,
            title: 'Step 3: Polite Breakup',
            subject: 'Re: {Quick question|Brief inquiry} re: {{Company}} search rankings',
            body: 'Hi {{First_Name}},\n\nAssuming SEO ranking recovery isn\'t a priority for {{Company}} right now, so I won\'t follow up again.\n\nIf capturing organic search traffic becomes a focus later, feel free to reach back out.\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          }
        ];
      } else if (framework === 'web_dev_agency') {
        generatedSequence = [
          {
            id: 1,
            day: 1,
            type: 'initial' as const,
            title: 'Step 1: White-Label Dev Overflow',
            subject: '{White-label dev|Engineering partner} for {{Company}}',
            body: '{{Hey|Hi}} {{First_Name}},\n\nWe provide white-label full-stack development for agencies scaling client delivery with zero full-time overhead.\n\nSample work and portfolio builds here: {{Pitch_Page_URL}}\n\n{{Worth a quick 5-min intro this week?|Open to connecting?}}\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          },
          {
            id: 2,
            day: 3,
            type: 'followup' as const,
            title: 'Step 2: Speed & Scale Proof',
            subject: 'Re: {White-label dev|Engineering partner} for {{Company}}',
            body: 'Hi {{First_Name}},\n\nQuick follow-up on my note below—we recently helped an agency partner deliver 4 client web apps in 3 weeks with 100% white-label confidentiality.\n\nCurious if dev overflow is on your radar this quarter?\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          },
          {
            id: 3,
            day: 7,
            type: 'breakup' as const,
            title: 'Step 3: Polite Breakup',
            subject: 'Re: {White-label dev|Engineering partner} for {{Company}}',
            body: 'Hey {{First_Name}},\n\nClosing the loop on engineering partnerships so I don\'t clutter your inbox.\n\nIf you ever need high-speed dev backup down the road, feel free to reach back out.\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          }
        ];
      } else {
        generatedSequence = [
          {
            id: 1,
            day: 1,
            type: 'initial' as const,
            title: 'Step 1: Value Hook & Free Gift',
            subject: '{Quick question|Brief inquiry} re: {{Company}}',
            body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\nWe help ' + targetAudience + ' ' + targetOffer + ' without ' + targetPain + '.\n\nPut together a quick 60-second video walkthrough for {{Company}} here: {{Pitch_Page_URL}}\n\n' + targetCta + '\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          },
          {
            id: 2,
            day: 3,
            type: 'followup' as const,
            title: 'Step 2: Proof & Case Study',
            subject: 'Re: {Quick question|Brief inquiry} re: {{Company}}',
            body: 'Hi {{First_Name}},\n\nQuick follow-up on my note below—recently helped a team in your space add 28 qualified discovery calls in under 14 days without domain burn.\n\nDid you get a chance to check out the custom walkthrough?\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          },
          {
            id: 3,
            day: 7,
            type: 'breakup' as const,
            title: 'Step 3: Polite Breakup',
            subject: 'Re: {Quick question|Brief inquiry} re: {{Company}}',
            body: 'Hey {{First_Name}},\n\nAssuming solving ' + targetPain + ' isn\'t a priority for {{Company}} right now, so I won\'t follow up again.\n\nIf anything changes down the line, feel free to reach back out.\n\nBest,\nYour Name',
            spamScore: 100,
            spamWordsFound: []
          }
        ];
      }

      generatedSequence = generatedSequence.map(s => {
        const fullText = `${s.subject} ${s.body}`;
        const spamAnalysis = analyzeSpamRisk(fullText);
        return {
          ...s,
          spamScore: spamAnalysis.score,
          spamWordsFound: spamAnalysis.wordsFound
        };
      });
    }

    return NextResponse.json({
      success: true,
      sequence: generatedSequence,
      engine: effectiveApiKey ? 'gemini-2.0-flash-hormozi' : 'hormozi-100m-leads-framework'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate sequence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
