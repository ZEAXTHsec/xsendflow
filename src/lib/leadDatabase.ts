import { Lead } from '@/lib/types';
import { UserPlan, PLAN_LIMITS } from '@/lib/planLimits';
import { sanitizeFirstName, sanitizeCompanyName, sanitizeJobTitle, isRoleBasedEmail, isValidEmailFormat, generateLocalIcebreaker, createSlug } from '@/lib/sanitizer';

export interface SyncResult {
  updatedMasterLeads: Lead[];
  addedCount: number;
  updatedCount: number;
  replacedCount: number;
  totalCount: number;
}

/**
 * Normalizes raw contact data into a fully-sanitized, enriched Lead record.
 */
export function sanitizeRawContact(raw: any, index: number = 0): Lead {
  const rawFirst = (raw.firstName || raw.rawFirstName || raw.first_name || raw.name || '').trim();
  const rawLast = (raw.lastName || raw.rawLastName || raw.last_name || '').trim();
  const rawComp = (raw.company || raw.rawCompany || raw.company_name || '').trim();
  const rawTit = (raw.title || raw.rawTitle || raw.job_title || raw.role || '').trim();
  let email = (raw.email || '').trim().toLowerCase();

  // Fix common domain typos
  email = email
    .replace(/@gmai\.com$/i, '@gmail.com')
    .replace(/@yaho\.com$/i, '@yahoo.com')
    .replace(/@hotmial\.com$/i, '@hotmail.com')
    .replace(/@outlok\.com$/i, '@outlook.com');

  const cleanFirstName = sanitizeFirstName(rawFirst);
  const cleanCompany = sanitizeCompanyName(rawComp);
  const cleanTitle = sanitizeJobTitle(rawTit);
  const isRole = isRoleBasedEmail(email);
  const isValid = isValidEmailFormat(email);
  const slug = createSlug(cleanFirstName, cleanCompany);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://xsendflow.com';
  const pitchUrl = raw.pitchUrl || `${appUrl}/p/${slug}?name=${encodeURIComponent(cleanFirstName)}&company=${encodeURIComponent(cleanCompany)}&title=${encodeURIComponent(cleanTitle || 'Growth Leader')}`;
  const icebreaker = raw.icebreaker || generateLocalIcebreaker(cleanFirstName || 'there', cleanCompany || 'your company', cleanTitle);

  return {
    id: raw.id || `lead-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    rawFirstName: rawFirst,
    rawLastName: rawLast,
    rawCompany: rawComp,
    rawTitle: rawTit,
    email,
    cleanFirstName,
    cleanCompany,
    cleanTitle,
    icebreaker,
    isRoleEmail: isRole,
    isValidEmail: isValid,
    pitchSlug: slug,
    pitchUrl,
    status: (isValid && !isRole ? 'cleaned' : isRole ? 'flagged' : 'error') as Lead['status'],
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Synchronizes incoming campaign leads into the Master Lead Database.
 * 
 * Rules:
 * 1. Deduplicates by email address.
 * 2. If lead already exists, updates existing record with any newly enriched fields.
 * 3. If lead is new, appends to the master database.
 * 4. FIFO Smart Replacement on Free Plan (250 leads max):
 *    If the new master pool exceeds 250 on Free Tier, new unique leads take priority
 *    and replace the oldest leads in the pool.
 */
export function syncUploadedLeadsToMasterDB(
  incomingContacts: any[],
  userPlan: UserPlan = 'free',
  existingMasterLeads?: Lead[]
): SyncResult {
  if (!incomingContacts || incomingContacts.length === 0) {
    const current = existingMasterLeads || getStoredMasterLeads();
    return {
      updatedMasterLeads: current,
      addedCount: 0,
      updatedCount: 0,
      replacedCount: 0,
      totalCount: current.length
    };
  }

  const currentMaster = existingMasterLeads ? [...existingMasterLeads] : getStoredMasterLeads();
  const masterMap = new Map<string, Lead>();

  // Populate map with existing master leads
  for (const lead of currentMaster) {
    if (lead.email) {
      masterMap.set(lead.email.toLowerCase().trim(), lead);
    }
  }

  let addedCount = 0;
  let updatedCount = 0;
  const newLeadsToAdd: Lead[] = [];

  for (let i = 0; i < incomingContacts.length; i++) {
    const contact = incomingContacts[i];
    const emailKey = (contact.email || '').toLowerCase().trim();
    if (!emailKey || !emailKey.includes('@')) continue;

    const sanitized = sanitizeRawContact(contact, i);

    if (masterMap.has(emailKey)) {
      // Existing lead -> update fields
      const existing = masterMap.get(emailKey)!;
      const updated: Lead = {
        ...existing,
        cleanFirstName: sanitized.cleanFirstName || existing.cleanFirstName,
        cleanCompany: sanitized.cleanCompany || existing.cleanCompany,
        cleanTitle: sanitized.cleanTitle || existing.cleanTitle,
        icebreaker: sanitized.icebreaker || existing.icebreaker,
        pitchUrl: sanitized.pitchUrl || existing.pitchUrl,
        updatedAt: new Date().toISOString()
      };
      masterMap.set(emailKey, updated);
      updatedCount++;
    } else {
      // New unique lead
      masterMap.set(emailKey, sanitized);
      newLeadsToAdd.push(sanitized);
      addedCount++;
    }
  }

  let fullPool = Array.from(masterMap.values());
  const maxAllowed = PLAN_LIMITS[userPlan]?.maxContacts || 250;
  let replacedCount = 0;

  // Enforce Plan Capacity Limits (e.g. 250 for Free, Unlimited for Pro/Agency)
  if (Number.isFinite(maxAllowed) && fullPool.length > maxAllowed) {
    replacedCount = fullPool.length - maxAllowed;
    // Smart FIFO: Keep the newest/most recently updated records up to maxAllowed
    fullPool.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA; // Descending (newest first)
    });
    fullPool = fullPool.slice(0, maxAllowed);
  }

  // Persist to localStorage if running in browser
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('xsendflow_leads', JSON.stringify(fullPool));
      window.dispatchEvent(new CustomEvent('xsendflow_leads_updated', { detail: { leads: fullPool } }));
    } catch (e) {
      console.error('Failed to save master leads to localStorage:', e);
    }
  }

  return {
    updatedMasterLeads: fullPool,
    addedCount,
    updatedCount,
    replacedCount,
    totalCount: fullPool.length
  };
}

/**
 * Loads the current master leads from localStorage.
 */
export function getStoredMasterLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('xsendflow_leads');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading xsendflow_leads:', e);
  }
  return [];
}
