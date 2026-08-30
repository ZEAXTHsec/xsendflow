/**
 * Real Flesch-Kincaid Grade Level & Readability Scoring Engine
 * Uses standard linguistic algorithms to measure sentence complexity,
 * syllable density, word count, and cold email inbox deliverability readiness.
 */

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  // Strip common silent endings
  let w = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  w = w.replace(/^y/, '');

  const matches = w.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export interface ReadabilityMetrics {
  wordCount: number;
  sentenceCount: number;
  syllableCount: number;
  fleschKincaidGrade: number;
  readingEase: number;
  gradeLabel: string;
  gradeStatus: 'optimal' | 'acceptable' | 'warning';
  wordCountStatus: 'optimal' | 'acceptable' | 'warning';
}

export function calculateReadability(text: string): ReadabilityMetrics {
  if (!text || !text.trim()) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      syllableCount: 0,
      fleschKincaidGrade: 0,
      readingEase: 100,
      gradeLabel: 'Grade 0',
      gradeStatus: 'optimal',
      wordCountStatus: 'optimal'
    };
  }

  // Strip URLs, merge tags (e.g. {{First_Name}}) and spintax markers before calculating
  const cleanText = text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\{\{[^}]+\}\}/g, 'John')
    .replace(/\{[^}]+\}/g, (match) => {
      const parts = match.slice(1, -1).split('|');
      return parts[0] || '';
    })
    .trim();

  const words = cleanText.match(/\b[a-zA-Z0-9'-]+\b/g) || [];
  const wordCount = words.length;

  // Split by sentence terminators AND line breaks / colons (conversational boundaries)
  const sentences = cleanText
    .split(/[\r\n]+|[.!?:]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && /\w/.test(s));

  const sentenceCount = Math.max(1, sentences.length);

  let syllableCount = 0;
  for (const w of words) {
    syllableCount += countSyllables(w);
  }

  if (wordCount === 0) {
    return {
      wordCount: 0,
      sentenceCount: 1,
      syllableCount: 0,
      fleschKincaidGrade: 1.0,
      readingEase: 100,
      gradeLabel: 'Grade 1.0',
      gradeStatus: 'optimal',
      wordCountStatus: 'optimal'
    };
  }

  // Flesch-Kincaid Grade Level formula:
  // 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  const rawGrade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  const fleschKincaidGrade = Math.max(1.0, Math.min(16.0, Number(rawGrade.toFixed(1))));

  // Flesch Reading Ease formula:
  // 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const rawEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const readingEase = Math.max(0, Math.min(100, Math.round(rawEase)));

  // Determine cold email status (Goal: <= 4th grade reading level for max inbox reply rates)
  let gradeStatus: 'optimal' | 'acceptable' | 'warning' = 'optimal';
  if (fleschKincaidGrade > 6.5) {
    gradeStatus = 'warning';
  } else if (fleschKincaidGrade > 4.5) {
    gradeStatus = 'acceptable';
  }

  // Word count status (Goal: <= 50 words for initial cold emails)
  let wordCountStatus: 'optimal' | 'acceptable' | 'warning' = 'optimal';
  if (wordCount > 65) {
    wordCountStatus = 'warning';
  } else if (wordCount > 50) {
    wordCountStatus = 'acceptable';
  }

  return {
    wordCount,
    sentenceCount,
    syllableCount,
    fleschKincaidGrade,
    readingEase,
    gradeLabel: `Grade ${fleschKincaidGrade.toFixed(1)}`,
    gradeStatus,
    wordCountStatus
  };
}
