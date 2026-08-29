import { UserPlan } from './planLimits';

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
 * Creates, Upgrades, or Cumulatively Extends an existing license.
 * - Upgrading tiers generates a new tier key (e.g. XSF-AGENCY-...) and stacks days.
 * - Buying another month/year on the same tier keeps the key and adds +30 / +365 days to the existing expiration date.
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

  // Calculate Base Expiry: If user still has valid days, stack on top of existing expiration!
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
