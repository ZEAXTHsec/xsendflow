import { UserPlan } from './planLimits';

export interface ScheduledDowngrade {
  nextPlan: UserPlan;
  effectiveAt: string; // ISO date when current tier expires and nextPlan activates
  addedDays: number;
  billingCycle: 'monthly' | 'annual' | 'lifetime';
}

export interface LicenseDetails {
  plan: UserPlan;
  licenseKey: string;
  status: 'active' | 'trial' | 'past_due' | 'expired';
  issuedAt: string;
  expiresAt: string;
  daysRemaining: number;
  billingCycle: 'monthly' | 'annual' | 'lifetime';
  autoRenew: boolean;
  maxInboxes: number | string;
  maxCampaigns: number | string;
  cloudActive: boolean;
  vpsActive?: boolean;
  scheduledDowngrade?: ScheduledDowngrade | null;
}

const DEFAULT_LICENSE_EXPIRY_DAYS = 30;

export function getStoredLicense(): LicenseDetails {
  if (typeof window === 'undefined') {
    return createDefaultLicense('free');
  }

  try {
    const raw = localStorage.getItem('xsendflow_license');
    if (raw) {
      const parsed: LicenseDetails = JSON.parse(raw);
      const now = new Date().getTime();
      const expiry = new Date(parsed.expiresAt).getTime();

      // Check if a scheduled downgrade has now reached its effective date!
      if (parsed.scheduledDowngrade && now >= new Date(parsed.scheduledDowngrade.effectiveAt).getTime()) {
        const nextPlan = parsed.scheduledDowngrade.nextPlan;
        const newExpiry = new Date(new Date(parsed.scheduledDowngrade.effectiveAt).getTime() + parsed.scheduledDowngrade.addedDays * 24 * 60 * 60 * 1000);
        const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        const prefix = nextPlan === 'agency' ? 'XSF-AGENCY' : nextPlan === 'pro' ? 'XSF-PRO' : 'XSF-FREE';
        
        parsed.plan = nextPlan;
        parsed.licenseKey = `${prefix}-${randomHash}`;
        parsed.expiresAt = newExpiry.toISOString();
        parsed.billingCycle = parsed.scheduledDowngrade.billingCycle;
        parsed.maxInboxes = nextPlan === 'free' ? 1 : 'Unlimited';
        parsed.maxCampaigns = nextPlan === 'free' ? 1 : nextPlan === 'pro' ? 5 : 'Unlimited';
        parsed.cloudActive = nextPlan !== 'free';
        parsed.scheduledDowngrade = null;

        const diffDays = Math.max(0, Math.ceil((newExpiry.getTime() - now) / (1000 * 60 * 60 * 24)));
        parsed.daysRemaining = diffDays;
        parsed.status = diffDays > 0 ? 'active' : 'expired';

        localStorage.setItem('xsendflow_license', JSON.stringify(parsed));
        localStorage.setItem('xsendflow_user_plan', nextPlan);
        window.dispatchEvent(new Event('xsendflow_plan_updated'));
        window.dispatchEvent(new Event('xsendflow_license_updated'));
        return parsed;
      }

      const diffDays = Math.max(0, Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)));
      parsed.daysRemaining = diffDays;
      if (diffDays <= 0 && parsed.plan !== 'free') {
        parsed.status = 'expired';
      }
      return parsed;
    }
  } catch {
    // Ignore error
  }

  const currentPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
  return createDefaultLicense(currentPlan);
}

/**
 * Creates, Upgrades, Cumulatively Extends, or Gracefully Schedules Downgrades.
 * - Upgrades (Free -> Pro, Pro -> Agency): Immediate upgrade, issues new tier key, stacks days.
 * - Same Tier Renewals: Adds +30 / +365 days onto current expiration date and preserves key.
 * - Downgrades (Agency -> Pro while having active Agency time): Preserves full Agency tier for remaining days,
 *   and automatically transitions to Pro for +30 days after Agency period ends.
 */
export function createDefaultLicense(
  plan: UserPlan, 
  cycle: 'monthly' | 'annual' | 'lifetime' = 'monthly'
): LicenseDetails {
  const now = new Date();
  let existingLicense: LicenseDetails | null = null;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('xsendflow_license');
      if (raw) existingLicense = JSON.parse(raw);
    } catch {}
  }

  // Graceful Downgrade Protection: If an active Agency user purchases Pro, let them keep Agency until it expires!
  if (
    existingLicense && 
    existingLicense.plan === 'agency' && 
    plan === 'pro' && 
    new Date(existingLicense.expiresAt).getTime() > now.getTime()
  ) {
    const addedDays = (cycle === 'annual') ? 365 : DEFAULT_LICENSE_EXPIRY_DAYS;
    existingLicense.scheduledDowngrade = {
      nextPlan: 'pro',
      effectiveAt: existingLicense.expiresAt,
      addedDays,
      billingCycle: cycle
    };
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('xsendflow_license', JSON.stringify(existingLicense));
        window.dispatchEvent(new Event('xsendflow_license_updated'));
      } catch {}
    }
    return existingLicense;
  }

  // Calculate Base Expiry: If user still has valid days on same or lower tier, stack on top of existing expiration!
  let baseDate = now;
  if (existingLicense && existingLicense.plan !== 'free' && existingLicense.expiresAt) {
    const existingExpiryDate = new Date(existingLicense.expiresAt);
    if (existingExpiryDate.getTime() > now.getTime()) {
      baseDate = existingExpiryDate; // Stack onto existing remaining days
    }
  }

  const expiry = new Date(baseDate);

  if (plan === 'free') {
    expiry.setFullYear(now.getFullYear() + 99); // Free never expires
  } else if (cycle === 'annual') {
    expiry.setFullYear(expiry.getFullYear() + 1); // +365 days
  } else {
    expiry.setDate(expiry.getDate() + DEFAULT_LICENSE_EXPIRY_DAYS); // +30 days
  }

  const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Key Generation: If renewing on same tier, preserve key. If upgrading, issue tier-appropriate key.
  let licenseKey = '';
  if (existingLicense && existingLicense.plan === plan && existingLicense.licenseKey) {
    licenseKey = existingLicense.licenseKey;
  } else {
    const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = plan === 'agency' ? 'XSF-AGENCY' : plan === 'pro' ? 'XSF-PRO' : 'XSF-FREE';
    licenseKey = `${prefix}-${randomHash}`;
  }

  const license: LicenseDetails = {
    plan,
    licenseKey,
    status: 'active',
    issuedAt: existingLicense?.issuedAt || now.toISOString(),
    expiresAt: expiry.toISOString(),
    daysRemaining,
    billingCycle: cycle,
    autoRenew: plan !== 'free',
    maxInboxes: plan === 'free' ? 1 : 'Unlimited',
    maxCampaigns: plan === 'free' ? 1 : plan === 'pro' ? 5 : 'Unlimited',
    cloudActive: plan !== 'free',
    vpsActive: plan !== 'free',
    scheduledDowngrade: null,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('xsendflow_license', JSON.stringify(license));
      localStorage.setItem('xsendflow_user_plan', plan);
      window.dispatchEvent(new Event('xsendflow_plan_updated'));
      window.dispatchEvent(new Event('xsendflow_license_updated'));
    } catch {}
  }

  return license;
}

export function saveLicense(license: LicenseDetails): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('xsendflow_license', JSON.stringify(license));
    localStorage.setItem('xsendflow_user_plan', license.plan);
    window.dispatchEvent(new Event('xsendflow_plan_updated'));
    window.dispatchEvent(new Event('xsendflow_license_updated'));
  } catch {}
}

export function redeemLicenseCode(code: string): { success: boolean; plan?: UserPlan; message: string; daysRemaining?: number } {
  const clean = code.trim().toUpperCase();

  if (!clean) {
    return { success: false, message: 'Please enter a license key.' };
  }

  // Pre-configured Enterprise & Founder Codes
  let targetPlan: UserPlan = 'pro';
  let cycle: 'monthly' | 'annual' | 'lifetime' = 'annual';

  if (clean.includes('AGENCY') || clean.includes('SCALE') || clean === 'XSF-AGENCY-VIP' || clean === 'FOUNDER-AGENCY') {
    targetPlan = 'agency';
    cycle = 'annual';
  } else if (clean.includes('PRO') || clean === 'XSF-PRO-PASS' || clean === 'GROWTH-PRO') {
    targetPlan = 'pro';
    cycle = 'annual';
  } else if (clean.startsWith('XSF-')) {
    // Valid generic XSF format
    targetPlan = clean.includes('AGENCY') ? 'agency' : 'pro';
  } else {
    return { success: false, message: 'Invalid license key format. Keys start with XSF-PRO or XSF-AGENCY.' };
  }

  const updatedLicense = createDefaultLicense(targetPlan, cycle);
  saveLicense(updatedLicense);

  return {
    success: true,
    plan: targetPlan,
    daysRemaining: updatedLicense.daysRemaining,
    message: `License Activated! Upgraded to ${targetPlan.toUpperCase()} with ${updatedLicense.daysRemaining} days active.`,
  };
}
