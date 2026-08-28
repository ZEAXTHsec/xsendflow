/**
 * Sanitizer & Lead Enrichment Utilities for XSendFlow Studio
 */

const HONORIFICS_REGEX = /^(dr\.?|mr\.?|mrs\.?|ms\.?|prof\.?|sir|madam|hon\.?)\s+/i;
const SUFFIX_TAGS_REGEX = /[\(\[\{].*?[\)\]\}]|\s+(phd|md|mba|cpa|ceo|founder|co-founder|jr\.?|sr\.?|iii|ii|esq\.?)$/gi;
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu;

const LEGAL_ENTITY_REGEX = /\b(inc(\.|\b)|llc(\.|\b)|l\.l\.c\.?|ltd(\.|\b)|limited|corp(\.|\b)|corporation|pvt(\.|\b)\s*ltd(\.|\b)|pty(\.|\b)\s*ltd(\.|\b)|gmbh|co(\.|\b)|company|s\.a\.|llp(\.|\b))\b/gi;
const DOMAIN_SUFFIX_REGEX = /\.(com|io|ai|co|net|org|dev|app|tech|agency|cloud|in|co\.uk|de|ca)$/i;

const ROLE_EMAIL_PREFIXES = new Set([
  'admin', 'administrator', 'info', 'support', 'help', 'billing', 'contact',
  'sales', 'marketing', 'press', 'media', 'jobs', 'careers', 'team',
  'hello', 'office', 'inquiries', 'enquiries', 'security', 'privacy',
  'legal', 'accounting', 'finance', 'feedback', 'general', 'mail', 'service'
]);

export function sanitizeFirstName(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.trim();
  
  // Remove emojis
  name = name.replace(EMOJI_REGEX, '');
  // Remove honorifics like Dr., Mr., etc.
  name = name.replace(HONORIFICS_REGEX, '');
  // Remove parenthetical notes like (CEO), (Hiring), [Acme], etc.
  name = name.replace(SUFFIX_TAGS_REGEX, '');
  // If full name passed, take the first word
  name = name.split(/\s+/)[0] || '';
  // Clean special characters
  name = name.replace(/[^a-zA-Z\xC0-\u024F'-]/g, '');
  
  if (!name) return '';
  
  // Capitalize properly (e.g., "STEPHEN" -> "Stephen", "mAcDoNaLd" -> "Macdonald")
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function sanitizeCompanyName(rawCompany: string): string {
  if (!rawCompany) return '';
  let company = rawCompany.trim();
  
  // Remove emojis
  company = company.replace(EMOJI_REGEX, '');
  // Remove parenthetical details
  company = company.replace(/[\(\[\{].*?[\)\]\}]/g, '');
  // Remove website suffixes if they exist
  company = company.replace(DOMAIN_SUFFIX_REGEX, '');
  // Remove legal entity identifiers
  company = company.replace(LEGAL_ENTITY_REGEX, '');
  // Remove trailing dashes, pipes or slogans (e.g. "Acme - Fast Logistics" -> "Acme")
  company = company.split(/\s*[-|–—/]\s*/)[0] || '';
  
  // Trim spaces and punctuation
  company = company.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
  
  if (!company) return '';
  
  // If entirely uppercase or lowercase, convert to Title Case
  if (company === company.toUpperCase() || company === company.toLowerCase()) {
    company = company
      .toLowerCase()
      .split(' ')
      .map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '')
      .join(' ');
  }
  
  return company;
}

export function sanitizeJobTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  let title = rawTitle.trim();
  
  title = title.replace(EMOJI_REGEX, '');
  title = title.replace(/[\(\[\{].*?[\)\]\}]/g, '');
  // Split at slash or ampersand to get primary role (e.g. "VP of Growth & Strategy" -> "VP of Growth")
  title = title.split(/\s*(&|\band\b|\/|\|)\s*/i)[0] || '';
  
  title = title.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim();
  return title;
}

export function isRoleBasedEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const prefix = email.split('@')[0].toLowerCase().trim();
  return ROLE_EMAIL_PREFIXES.has(prefix);
}

export function isValidEmailFormat(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

export function generateLocalIcebreaker(firstName: string, company: string, title?: string): string {
  const hooks = [
    `Loved the recent growth trajectory at ${company}—congrats on the momentum.`,
    `Noticed what your team is building at ${company}; really impressed by your approach.`,
    `Saw your work leading ${title ? title.toLowerCase() : 'initiatives'} at ${company} and wanted to reach out directly.`,
    `Was researching top teams in your space and ${company} immediately stood out.`,
    `Quick note to compliment the execution on ${company}'s current market expansion.`
  ];
  
  // Deterministic pick based on company + name length to remain stable on re-renders
  const index = Math.abs((firstName.length + company.length) % hooks.length);
  return hooks[index];
}

export function createSlug(name: string, company: string): string {
  const cleanN = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanC = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanC || 'company'}-${cleanN || 'prospect'}`;
}
