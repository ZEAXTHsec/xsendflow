/**
 * Smart Lead Sanitizer & Disposable Email Blocklist
 */

export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
  'temp-mail.org',
  'fakeinbox.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'inboxkitten.com',
  'mytemp.email',
  'mohmal.com',
  'burnermail.io',
  'crazymailing.com',
  'nada.ltd',
  'getnada.com',
  'dropmail.me',
  'fakemailgenerator.com',
  'emailondeck.com',
  'tempail.com',
  'tempmailaddress.com',
  'throwawaymail.net',
  'trashmail.net',
  'trashmail.org',
  'yopmail.fr',
  'yopmail.net'
]);

export const ROLE_BASED_PREFIXES = new Set([
  'abuse',
  'postmaster',
  'spam',
  'mailer-daemon',
  'no-reply',
  'noreply',
  'donotreply',
  'ftp',
  'hostmaster',
  'usenet',
  'news',
  'security'
]);

export interface ValidationDetail {
  isValid: boolean;
  reason?: 'disposable_domain' | 'role_based_trap' | 'invalid_syntax';
}

export function validateSingleEmail(email: string): ValidationDetail {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'invalid_syntax' };
  }

  const clean = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, reason: 'invalid_syntax' };
  }

  const [localPart, domain] = clean.split('@');
  if (!localPart || !domain) {
    return { isValid: false, reason: 'invalid_syntax' };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, reason: 'disposable_domain' };
  }

  if (ROLE_BASED_PREFIXES.has(localPart)) {
    return { isValid: false, reason: 'role_based_trap' };
  }

  return { isValid: true };
}

export interface SanitizedBatchResult<T> {
  validItems: T[];
  removedStats: {
    disposable: number;
    roleBased: number;
    invalidSyntax: number;
    totalRemoved: number;
    totalOriginal: number;
  };
}

export function sanitizeEmailBatch<T extends { email: string }>(
  items: T[],
  filterActive: boolean = true
): SanitizedBatchResult<T> {
  const stats = {
    disposable: 0,
    roleBased: 0,
    invalidSyntax: 0,
    totalRemoved: 0,
    totalOriginal: items.length
  };

  if (!filterActive) {
    const validSyntaxOnly = items.filter(item => {
      const v = validateSingleEmail(item.email);
      if (v.reason === 'invalid_syntax') {
        stats.invalidSyntax++;
        stats.totalRemoved++;
        return false;
      }
      return true;
    });
    return { validItems: validSyntaxOnly, removedStats: stats };
  }

  const validItems = items.filter(item => {
    const v = validateSingleEmail(item.email);
    if (!v.isValid) {
      if (v.reason === 'disposable_domain') stats.disposable++;
      else if (v.reason === 'role_based_trap') stats.roleBased++;
      else if (v.reason === 'invalid_syntax') stats.invalidSyntax++;
      stats.totalRemoved++;
      return false;
    }
    return true;
  });

  return { validItems, removedStats: stats };
}
