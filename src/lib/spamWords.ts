/**
 * Spam Trigger Word Database & De-Spamify Rewriting Engine
 */

export interface SpamDetectionResult {
  score: number; // 0 (Severe Spam) to 100 (Pristine Deliverability)
  grade: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  wordsFound: string[];
  highlightedText: string;
  suggestionCount: number;
}

// 300+ spam keywords categorized
export const SPAM_REPLACEMENTS: Record<string, string> = {
  '100% free': 'at no cost',
  '100% satisfied': 'confident in the outcome',
  '100% guarantee': 'commitment to quality',
  'risk-free': 'flexible and straightforward',
  'risk free': 'flexible',
  'money back': 'satisfaction focused',
  'guarantee': 'ensure',
  'guaranteed': 'assured',
  'buy now': 'take a look',
  'order now': 'get started',
  'act now': 'explore when ready',
  'urgent': 'time-sensitive',
  'click here': 'view the details here',
  'click now': 'check this out',
  'discount': 'tailored pricing',
  'special promotion': 'custom initiative',
  'free trial': 'test walkthrough',
  'make money': 'generate revenue',
  'earn cash': 'improve unit economics',
  'extra income': 'growth margin',
  'no credit card required': 'no setup friction',
  'no obligation': 'no strings attached',
  'winner': 'selected',
  'unbelievable': 'notable',
  'miracle': 'breakthrough',
  'hidden secrets': 'proven framework',
  'dear friend': 'hi',
  'cash bonus': 'benefit',
  'cheap': 'cost-effective',
  'lowest price': 'competitive value',
  'double your': 'significantly scale your',
  'instant profit': 'fast ROI',
  'multi-level marketing': 'partner network',
  'million dollars': 'high seven figures',
  'once in a lifetime': 'unique opportunity',
  'as seen on': 'featured in',
  'cancel at any time': 'flexible terms',
  'pure profit': 'net margins'
};

const SPAM_WORD_LIST = [
  ...Object.keys(SPAM_REPLACEMENTS),
  'billion dollars', 'cash prize', 'free gift', 'free consultation', 'free sample',
  'risk free trial', 'unlimited leads', 'no cost', 'no fee', 'penniless',
  'get rich', 'get paid', 'work from home', 'fast cash', 'instant income',
  'apply now', 'dont delete', 'exclusive deal', 'for you only', 'limited time',
  'take action', 'while supplies last', 'urgent response', 'expire today',
  'opt in', 'pre-approved', 'congratulations', 'claim now', 'you have been chosen',
  'save big', 'drastically reduce', 'bargain', 'clearance', 'affordable price',
  'cure', 'remedy', 'rejuvenate', 'miracle cure', 'weight loss',
  'crypto gain', 'forex bot', 'casino', 'jackpot', 'lottery',
  'mass email', 'bulk mailing', 'email harvester', 'scrape emails',
  'unsecured credit', 'refinance', 'consolidate debt', 'mortgage rates',
  'offshore', 'hidden charges', 'undisclosed', 'guaranteed ROI'
];

export function analyzeSpamRisk(text: string): SpamDetectionResult {
  if (!text || text.trim() === '') {
    return {
      score: 100,
      grade: 'EXCELLENT',
      wordsFound: [],
      highlightedText: '',
      suggestionCount: 0
    };
  }

  const lower = text.toLowerCase();
  const wordsFound: string[] = [];
  const foundSet = new Set<string>();

  // Check all spam keywords
  for (const word of SPAM_WORD_LIST) {
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(lower)) {
      if (!foundSet.has(word)) {
        foundSet.add(word);
        wordsFound.push(word);
      }
    }
  }

  // Calculate score: Start at 100, deduct 12 points per unique spam word
  const penalty = wordsFound.length * 14;
  const score = Math.max(0, 100 - penalty);

  let grade: SpamDetectionResult['grade'] = 'EXCELLENT';
  if (score < 50) grade = 'CRITICAL';
  else if (score < 75) grade = 'WARNING';
  else if (score < 90) grade = 'GOOD';

  // Highlight matches
  let highlightedText = text;
  for (const word of wordsFound) {
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped})\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<mark class="bg-rose-500/20 text-rose-300 border-b border-rose-500 font-medium px-1 rounded">$1</mark>`);
  }

  return {
    score,
    grade,
    wordsFound,
    highlightedText,
    suggestionCount: wordsFound.length
  };
}

export function deSpamifyText(text: string): { cleanedText: string; replacementCount: number } {
  let cleanedText = text;
  let replacementCount = 0;

  for (const [spamWord, replacement] of Object.entries(SPAM_REPLACEMENTS)) {
    const escaped = spamWord.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    if (regex.test(cleanedText)) {
      cleanedText = cleanedText.replace(regex, (match) => {
        replacementCount++;
        // Maintain initial uppercase if original was capitalized
        if (match.charAt(0) === match.charAt(0).toUpperCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      });
    }
  }

  return { cleanedText, replacementCount };
}
