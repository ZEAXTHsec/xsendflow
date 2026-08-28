import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpamRisk } from '@/lib/spamWords';
import { SequenceStep } from '@/lib/types';

interface GenerateRequest {
  offer?: string;
  audience?: string;
  painPoint?: string;
  framework?: 'provocative' | 'case_study' | 'video_pitch' | 'founder_intro';
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { offer, audience, painPoint, framework = 'video_pitch', apiKey } = body;

    const targetOffer = offer?.trim() || 'our automated outbound deliverability engine';
    const targetAudience = audience?.trim() || 'B2B founders & growth leaders';
    const targetPain = painPoint?.trim() || 'cold email spam placement and low reply rates';

    const effectiveApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    let generatedSequence: SequenceStep[] | null = null;

    // Try generating with Google Gemini 2.0 Flash if API key is configured
    if (effectiveApiKey) {
      try {
        const systemPrompt = `You are a world-class cold email copywriter who writes 7-figure outbound sequences.
CRITICAL RULES (ANTI-AI-SLOP):
1. UNDER 60 WORDS PER EMAIL. No fluff, no pleasantries.
2. NEVER use AI clichés: "I hope this email finds you well", "In today's fast-paced world", "revolutionary", "synergy", "unlock", "seamless".
3. Lowercase conversational subject lines: e.g. "quick question re: {{Company}}".
4. Peer-to-peer tone: Casual, direct, humble, professional.
5. Merge tags available: {{First_Name}}, {{Company}}, {{Pitch_Page_URL}}, {{Icebreaker}}.
6. Embed deep Spintax in every sentence using {Option 1|Option 2|Option 3} syntax.
7. Return a JSON object with a "steps" array containing 4 steps:
   - Step 1: Initial Hook + {{Icebreaker}} + {{Pitch_Page_URL}} + Low-friction CTA.
   - Step 2: Case study metric / quick proof point (Day 3).
   - Step 3: Direct 2-line nudge (Day 7).
   - Step 4: Graceful 1-line breakup (Day 12).

Respond ONLY with valid JSON in this structure:
{
  "steps": [
    { "id": 1, "day": 1, "type": "initial", "title": "Step 1: Value Hook & Custom Pitch", "subject": "...", "body": "..." },
    { "id": 2, "day": 3, "type": "followup", "title": "Step 2: Case Study & Proof", "subject": "...", "body": "..." },
    { "id": 3, "day": 7, "type": "nudge", "title": "Step 3: Direct 2-Line Nudge", "subject": "...", "body": "..." },
    { "id": 4, "day": 12, "type": "breakup", "title": "Step 4: Graceful Breakup", "subject": "...", "body": "..." }
  ]
}`;

        const userPrompt = `Target Offer: ${targetOffer}
Target Audience: ${targetAudience}
Core Pain Point to Solve: ${targetPain}
Framework Selected: ${framework}`;

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
              temperature: 0.7
            }
          })
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJsonText) {
            const parsed = JSON.parse(rawJsonText);
            if (Array.isArray(parsed.steps) && parsed.steps.length === 4) {
              generatedSequence = parsed.steps.map((s: SequenceStep, idx: number) => {
                const fullText = `${s.subject} ${s.body}`;
                const spamAnalysis = analyzeSpamRisk(fullText);
                const stepType: 'initial' | 'followup' | 'nudge' | 'breakup' =
                  s.type === 'initial' || s.type === 'followup' || s.type === 'nudge' || s.type === 'breakup'
                    ? s.type
                    : idx === 0 ? 'initial' : idx === 1 ? 'followup' : idx === 2 ? 'nudge' : 'breakup';

                return {
                  id: idx + 1,
                  day: s.day || (idx === 0 ? 1 : idx === 1 ? 3 : idx === 2 ? 7 : 12),
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
        console.warn('Gemini API call failed, falling back to local 7-figure framework:', err);
      }
    }

    // Fallback: 7-Figure Proven Copywriting Frameworks with Deep Nested Spintax
    if (!generatedSequence) {
      generatedSequence = [
        {
          id: 1,
          day: 1,
          type: 'initial' as const,
          title: 'Step 1: Value Hook & Custom Pitch Link',
          subject: '{{quick question|brief inquiry|intro}} re: {{Company}}',
          body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\n{{Saw what you\'re building at {{Company}} and put together a quick 60-second video roadmap for your team|Noticed {{Company}} is scaling outbound and recorded a tailored breakdown for you}}: {{Pitch_Page_URL}}\n\n{{Open to checking it out?|Worth a quick 5-min chat this week?|Mind if I send over details?}}\n\nBest,\nYour Name',
          spamScore: 100,
          spamWordsFound: []
        },
        {
          id: 2,
          day: 3,
          type: 'followup' as const,
          title: 'Step 2: Case Study & Proof',
          subject: 'Re: quick question re: {{Company}}',
          body: 'Hi {{First_Name}},\n\n{{Wanted to share a quick metric|Quick proof point}}: We recently helped a {{similar B2B team|team in your space}} {{boost inboxing from 42% to 99%|book 28 qualified demos}} in under 14 days using ' + targetOffer + '.\n\n{{Curious if solving ' + targetPain + ' is a focus for {{Company}} right now?|Worth a brief sync this Thursday?}}\n\nBest,\nYour Name',
          spamScore: 100,
          spamWordsFound: []
        },
        {
          id: 3,
          day: 7,
          type: 'nudge' as const,
          title: 'Step 3: Direct 2-Line Nudge',
          subject: 'following up on {{Company}}',
          body: 'Hi {{First_Name}},\n\n{{Any bandwidth to take a look at the custom walkthrough for {{Company}} ({{Pitch_Page_URL}})?|Floating this back to the top of your inbox in case you missed the custom pitch page ({{Pitch_Page_URL}}).}}\n\n{{No pressure either way.|Either way, wishing your team continued growth.}}\n\nBest,\nYour Name',
          spamScore: 100,
          spamWordsFound: []
        },
        {
          id: 4,
          day: 12,
          type: 'breakup' as const,
          title: 'Step 4: Graceful Breakup',
          subject: 'closing the loop on {{Company}}',
          body: 'Hi {{First_Name}},\n\n{{Assuming solving ' + targetPain + ' isn\'t a priority for {{Company}} right now, so I won\'t follow up again.|Closing the loop here as I don\'t want to clutter your inbox.}}\n\n{{If anything changes down the line, feel free to reach back out.|Wishing you and {{Company}} all the best.}}\n\nBest,\nYour Name',
          spamScore: 100,
          spamWordsFound: []
        }
      ].map(s => {
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
      engine: effectiveApiKey ? 'gemini-2.0-flash' : 'proven-7figure-framework'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate sequence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
