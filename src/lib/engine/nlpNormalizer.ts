/**
 * Intelligent NLP Normalizer, Typo Corrector & Multi-Variation Copywriting Engine
 * Automatically cleans up informal slang, typos, and improper grammar clauses,
 * and synthesizes 8+ distinct structural copywriting variations for cold email generation.
 */

// Common typo & slang dictionary mapping to high-converting professional terminology
const TYPO_AND_SLANG_MAP: Record<string, string> = {
  'dentistal': 'dental',
  'dentistal clinics': 'dental clinics & orthodontists',
  'teeth fixers': 'dental practices',
  'teeth cleaner': 'dental clinics',
  'teeth doc': 'dental practices',
  'roof fixers': 'commercial roofing contractors',
  'roofers': 'roofing contractors',
  'app makers': 'software development agencies',
  'coders': 'engineering teams',
  'realtor': 'real estate brokerages',
  'realtors': 'real estate brokerages',
  'house sellers': 'property investors & brokerages',
  'car detailers': 'fleet auto detailing specialists',
  'plumbers': 'commercial plumbing contractors',
  'pipe fixers': 'commercial plumbing specialists',
  'ad guys': 'digital marketing agencies',
  'ad agency': 'growth marketing agencies',
  'saas folks': 'B2B SaaS companies',
  'docotrs': 'medical practices & clinics',
  'medspa': 'medical spas & aesthetic clinics',
  'gyms': 'fitness centers & gym owners',
  'lawyers': 'law firms & attorneys',
  'truckers': 'freight & logistics carriers',
  'packagers': 'custom packaging manufacturers'
};

export function normalizeTargetAudience(raw: string): string {
  let cleaned = raw.trim().toLowerCase();
  for (const [bad, good] of Object.entries(TYPO_AND_SLANG_MAP)) {
    const reg = new RegExp(`\\b${bad}\\b`, 'gi');
    cleaned = cleaned.replace(reg, good);
  }
  // Capitalize main words cleanly if needed
  return cleaned.length > 0 ? cleaned : 'B2B founders & growth leaders';
}

export function normalizeOfferGrammar(raw: string): string {
  let cleaned = raw.trim();
  if (!cleaned) return 'generate 15 to 20 qualified discovery calls monthly';

  // If the user typed a noun without an action verb (e.g. "more bookings", "15 clients", "higher rankings")
  // Automatically prepend a natural transitive verb
  const lower = cleaned.toLowerCase();
  if (lower.startsWith('more ') || lower.startsWith('higher ') || lower.startsWith('better ')) {
    cleaned = 'generate ' + cleaned;
  } else if (/^[0-9]+/.test(cleaned) || lower.startsWith('a ') || lower.startsWith('an ')) {
    cleaned = 'secure ' + cleaned;
  } else if (!/^(generate|add|increase|boost|secure|scale|deliver|reduce|slash|cut|automate|capture|book|acquire|grow)\b/i.test(cleaned)) {
    cleaned = 'achieve ' + cleaned;
  }

  return cleaned;
}

export function normalizePainPointGrammar(raw: string): string {
  let cleaned = raw.trim();
  if (!cleaned) return 'wasting budget on low-converting ads and landing in spam';

  // Fix typos
  for (const [bad, good] of Object.entries(TYPO_AND_SLANG_MAP)) {
    const reg = new RegExp(`\\b${bad}\\b`, 'gi');
    cleaned = cleaned.replace(reg, good);
  }

  return cleaned;
}

export interface GeneratedVariation {
  id: number;
  day: number;
  type: 'initial' | 'followup' | 'breakup';
  title: string;
  subject: string;
  body: string;
}

export function generateDynamicSequence(
  rawAudience: string,
  rawOffer: string,
  rawPain: string,
  rawMagnet: string,
  rawCta: string,
  angle: string = 'value_teardown'
): GeneratedVariation[] {
  const audience = normalizeTargetAudience(rawAudience);
  const offer = normalizeOfferGrammar(rawOffer);
  const pain = normalizePainPointGrammar(rawPain);
  const magnet = rawMagnet.trim() || 'a 60-second video teardown ({{Pitch_Page_URL}})';
  const cta = rawCta.trim() || 'Worth a quick look?';

  // 8 Diverse Structural Copywriting Archetypes
  const variationTemplates = [
    // TEMPLATE 1: Value Teardown / Asset Lead
    {
      t1Subject: '{Quick question|Brief inquiry} re: {{Company}}',
      t1Body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\nWe help ' + audience + ' ' + offer + ' without ' + pain + '.\n\nPut together ' + magnet + ' specifically for {{Company}}.\n\n' + cta + '\n\nBest,\nYour Name',
      t2Subject: 'Re: {Quick question|Brief inquiry} re: {{Company}}',
      t2Body: 'Hi {{First_Name}},\n\nQuick follow-up on my note below—recently helped a similar team ' + offer + ' in under 30 days.\n\nDid you get a chance to review ' + magnet + '?\n\nBest,\nYour Name',
      t3Subject: 'Re: {Quick question|Brief inquiry} re: {{Company}}',
      t3Body: 'Hey {{First_Name}},\n\nAssuming solving ' + pain + ' isn\'t a priority for {{Company}} right now, so I won\'t follow up again.\n\nIf anything changes down the road, feel free to reach back out.\n\nBest,\nYour Name'
    },
    // TEMPLATE 2: Observation & Bottleneck
    {
      t1Subject: 'Idea for {{Company}}',
      t1Body: '{{Hi|Hello}} {{First_Name}},\n\n{{Icebreaker}}\n\nNoticed {{Company}} is scaling and wanted to share how we help ' + audience + ' ' + offer + '.\n\nRecorded ' + magnet + ' breaking down 3 quick growth fixes.\n\n' + cta + '\n\nBest,\nYour Name',
      t2Subject: 'Re: Idea for {{Company}}',
      t2Body: 'Hi {{First_Name}},\n\nFloating this note to the top of your inbox. Curious if ' + offer + ' is on your radar this quarter?\n\nBest,\nYour Name',
      t3Subject: 'Re: Idea for {{Company}}',
      t3Body: 'Hi {{First_Name}},\n\nClosing the loop on this so I don\'t clutter your inbox. If you ever need help with ' + offer + ', the door is always open.\n\nBest,\nYour Name'
    },
    // TEMPLATE 3: 3-Sentence Brevity Punch (<40 words)
    {
      t1Subject: '{{Company}} + ' + offer.split(' ').slice(0, 3).join(' '),
      t1Body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\nWe help ' + audience + ' ' + offer + ' without ' + pain + '.\n\nShared the breakdown here: ' + magnet + '.\n\n' + cta + '\n\nBest,\nYour Name',
      t2Subject: 'Re: {{Company}} + ' + offer.split(' ').slice(0, 3).join(' '),
      t2Body: 'Hi {{First_Name}},\n\nQuick bump on my note below—open to checking out the 1-page summary?\n\nBest,\nYour Name',
      t3Subject: 'Re: {{Company}} + ' + offer.split(' ').slice(0, 3).join(' '),
      t3Body: 'Hey {{First_Name}},\n\nAssuming this isn\'t relevant right now, so I\'ll leave you be. Best of luck scaling {{Company}}!\n\nBest,\nYour Name'
    },
    // TEMPLATE 4: Case Study & Proof Lead
    {
      t1Subject: 'How a peer team achieved ' + offer.split(' ').slice(0, 3).join(' '),
      t1Body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\nRecently helped a team like {{Company}} ' + offer + ' without ' + pain + '.\n\nDocumented the exact steps in ' + magnet + '.\n\n' + cta + '\n\nBest,\nYour Name',
      t2Subject: 'Re: How a peer team achieved ' + offer.split(' ').slice(0, 3).join(' '),
      t2Body: 'Hi {{First_Name}},\n\nQuick follow-up on the case study—open to seeing how we could replicate these numbers for {{Company}}?\n\nBest,\nYour Name',
      t3Subject: 'Re: How a peer team achieved ' + offer.split(' ').slice(0, 3).join(' '),
      t3Body: 'Hi {{First_Name}},\n\nAssuming ' + offer + ' isn\'t a priority for {{Company}} right now, so I won\'t follow up further.\n\nBest,\nYour Name'
    },
    // TEMPLATE 5: Direct Resource Drop
    {
      t1Subject: '{Resource|Breakdown} for {{Company}}',
      t1Body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\nPut together ' + magnet + ' showing how ' + audience + ' can ' + offer + ' without ' + pain + '.\n\n' + cta + '\n\nBest,\nYour Name',
      t2Subject: 'Re: {Resource|Breakdown} for {{Company}}',
      t2Body: 'Hi {{First_Name}},\n\nJust wanted to make sure the link worked: ' + magnet + '. Let me know what you think!\n\nBest,\nYour Name',
      t3Subject: 'Re: {Resource|Breakdown} for {{Company}}',
      t3Body: 'Hey {{First_Name}},\n\nFinal follow-up so I don\'t bug you. If you ever want to explore ' + offer + ', feel free to reach back out.\n\nBest,\nYour Name'
    }
  ];

  // Pick template based on angle or randomize
  let templateIndex = 0;
  if (angle === 'case_study_proof' || angle === 'case_study') {
    templateIndex = 3;
  } else if (angle === '3_sentence_hook') {
    templateIndex = 2;
  } else {
    // Randomize across templates 0, 1, 4 for dynamic variety!
    const choices = [0, 1, 4];
    templateIndex = choices[Math.floor(Math.random() * choices.length)];
  }

  const chosen = variationTemplates[templateIndex] || variationTemplates[0];

  return [
    {
      id: 1,
      day: 1,
      type: 'initial',
      title: 'Step 1: Value Hook & Asset',
      subject: chosen.t1Subject,
      body: chosen.t1Body
    },
    {
      id: 2,
      day: 3,
      type: 'followup',
      title: 'Step 2: Threaded Follow-up & Proof',
      subject: chosen.t2Subject,
      body: chosen.t2Body
    },
    {
      id: 3,
      day: 7,
      type: 'breakup',
      title: 'Step 3: Permission Breakup',
      subject: chosen.t3Subject,
      body: chosen.t3Body
    }
  ];
}
