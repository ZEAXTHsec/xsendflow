/**
 * Spintax Generator and Resolver Utilities for XSendFlow Studio
 */

export function parseSpintax(text: string): string {
  if (!text) return '';
  
  // Recursively resolve inner spintax containing at least one pipe option: {choice1|choice2|...}
  // This safely ignores merge tags like {{First_Name}} or {{Company}}
  let result = text;
  const spintaxPattern = /\{([^{}]*\|[^{}]*)\}/g;
  
  let iterations = 0;
  while (spintaxPattern.test(result) && iterations < 10) {
    result = result.replace(spintaxPattern, (_, choicesStr) => {
      const choices = choicesStr.split('|');
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex] ?? '';
    });
    iterations++;
  }
  
  return result;
}

export function generateSpintaxVariations(text: string, count: number = 3): string[] {
  const variations: string[] = [];
  for (let i = 0; i < count; i++) {
    variations.push(parseSpintax(text));
  }
  return variations;
}

/**
 * Automatically injects high-deliverability Spintax into common email patterns
 */
export function autoWrapSpintax(text: string): string {
  let output = text;

  // Greetings
  output = output.replace(/\b(Hi|Hey|Hello)\s+{{First_Name}}/gi, '{Hey|Hi|Hello} {{First_Name}}');
  output = output.replace(/\b(Good morning|Good day)\s+{{First_Name}}/gi, '{Good morning|Hey|Hello} {{First_Name}}');

  // Openers / Hooks
  output = output.replace(/\b(Quick question)\b/gi, '{Quick question|Quick inquiry|Brief question}');
  output = output.replace(/\b(Saw what your team is building at)\s+{{Company}}/gi, '{Saw what your team is building at|Noticed your momentum at|Loved what you are doing at} {{Company}}');
  output = output.replace(/\b(Reached out because)\b/gi, '{Reached out because|Reaching out since|Reaching out because}');

  // Calls to action
  output = output.replace(/\b(Worth a quick chat\?)\b/gi, '{Worth a quick chat?|Open to exploring this?|Worth 5 minutes this week?}');
  output = output.replace(/\b(Do you have 10 minutes next week\?)\b/gi, '{Do you have 10 minutes this week?|Open to a brief 10-min intro?|Any bandwidth for a quick chat next week?}');
  output = output.replace(/\b(Let me know your thoughts)\b/gi, '{Let me know your thoughts|Would love to hear your take|Curious what you think}');

  // Sign-offs
  output = output.replace(/\b(Best regards|Best|Cheers|Thanks)\b/gi, '{Best|Cheers|Best regards|Thanks}');

  return output;
}
