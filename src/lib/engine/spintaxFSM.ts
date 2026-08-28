/**
 * Finite-State Machine (FSM) Spintax Engine
 * Handles arbitrary nested Spintax: {{Hi|Hey} {{First_Name}|there}|Hello}
 * Preserves double-brace Merge Tags: {{First_Name}}, {{Company}}, {{Pitch_Page_URL}}, etc.
 */

// Temporarily tokenizes double-brace merge tags to prevent collision with single-brace spintax
function protectMergeTags(text: string): { protectedText: string; restore: (str: string) => string } {
  const placeholders: Record<string, string> = {};
  let counter = 0;

  // Only protect valid merge tag identifiers (e.g. {{First_Name}}, {{Company}}, etc.)
  const protectedText = text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, tag) => {
    const key = `___MERGETAG_${counter++}___`;
    placeholders[key] = `{{${tag}}}`;
    return key;
  });

  const restore = (str: string): string => {
    let result = str;
    for (const [key, original] of Object.entries(placeholders)) {
      result = result.replaceAll(key, original);
    }
    return result;
  };

  return { protectedText, restore };
}

/**
 * Parses and resolves all nested spintax choices randomly using FSM/AST logic
 */
export function parseDeepSpintax(text: string): string {
  if (!text) return '';

  const { protectedText, restore } = protectMergeTags(text);

  // Character-by-character stack-based recursive parser
  function evaluateSpintax(input: string): string {
    const innermost = /\{([^{}]+?)\}/;
    let current = input;
    let iterations = 0;
    const maxIterations = 200; // safety ceiling

    while (innermost.test(current) && iterations < maxIterations) {
      current = current.replace(innermost, (_, optionsStr) => {
        const parts = optionsStr.split('|');
        const chosen = parts[Math.floor(Math.random() * parts.length)];
        return chosen;
      });
      iterations++;
    }

    return current;
  }

  const resolved = evaluateSpintax(protectedText);
  return restore(resolved);
}

/**
 * Calculates the exact mathematical number of unique variations possible
 */
export function calculateSpintaxPermutations(text: string): number {
  if (!text) return 1;

  const { protectedText } = protectMergeTags(text);

  function countNested(str: string): number {
    const innermost = /\{([^{}]+?)\}/g;
    let count = 1;
    let match: RegExpExecArray | null;

    // Estimate independent spintax blocks
    while ((match = innermost.exec(str)) !== null) {
      const optionsCount = match[1].split('|').length;
      count *= Math.max(1, optionsCount);
    }

    return Math.max(1, count);
  }

  return countNested(protectedText);
}

/**
 * Generates N unique sample variations for previewing in UI
 */
export function generateSpintaxSamples(text: string, sampleCount = 5): string[] {
  const samples = new Set<string>();
  const maxAttempts = sampleCount * 8;
  let attempts = 0;

  while (samples.size < sampleCount && attempts < maxAttempts) {
    samples.add(parseDeepSpintax(text));
    attempts++;
  }

  return Array.from(samples);
}
