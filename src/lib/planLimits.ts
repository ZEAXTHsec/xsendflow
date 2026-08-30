export type UserPlan = 'free' | 'pro' | 'agency';

export interface PlanFeatureLimits {
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxMailboxes: number;
  maxActiveCampaigns: number;
  maxContacts: number;
  dailySendLimit: number;
  allowsVpsDaemon: boolean;
  aiIcebreakerLimit: number;
  allowsMultiMailboxRotation: boolean;
  allowsClientTags: boolean;
  allowsClientReports: boolean;
  canExportUnlimitedCsv: boolean;
}

export const PLAN_LIMITS: Record<UserPlan, PlanFeatureLimits> = {
  free: {
    name: 'Free Forever',
    priceMonthly: 0,
    priceAnnual: 0,
    maxMailboxes: 1,
    maxActiveCampaigns: 1,
    maxContacts: 250,
    dailySendLimit: 100,
    allowsVpsDaemon: false,
    aiIcebreakerLimit: 10,
    allowsMultiMailboxRotation: false,
    allowsClientTags: false,
    allowsClientReports: false,
    canExportUnlimitedCsv: false,
  },
  pro: {
    name: 'Pro Unlimited',
    priceMonthly: 29,
    priceAnnual: 249,
    maxMailboxes: 9999,
    maxActiveCampaigns: 5,
    maxContacts: 999999,
    dailySendLimit: 500,
    allowsVpsDaemon: true,
    aiIcebreakerLimit: 999999,
    allowsMultiMailboxRotation: true,
    allowsClientTags: false,
    allowsClientReports: false,
    canExportUnlimitedCsv: true,
  },
  agency: {
    name: 'Agency Scale',
    priceMonthly: 79,
    priceAnnual: 690,
    maxMailboxes: 99999,
    maxActiveCampaigns: 99999,
    maxContacts: 9999999,
    dailySendLimit: 9999999,
    allowsVpsDaemon: true,
    aiIcebreakerLimit: 9999999,
    allowsMultiMailboxRotation: true,
    allowsClientTags: true,
    allowsClientReports: true,
    canExportUnlimitedCsv: true,
  },
};

export function canAddMailbox(currentCount: number, plan: UserPlan = 'free'): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return currentCount < limits.maxMailboxes;
}

export function canCreateCampaign(totalCampaignsCount: number, plan: UserPlan = 'free'): boolean {
  if (plan === 'free') {
    return totalCampaignsCount < 1;
  }
  return true;
}

export function canLaunchCampaign(currentActiveCount: number, plan: UserPlan = 'free'): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return currentActiveCount < limits.maxActiveCampaigns;
}

export function canImportLeads(currentCount: number, newCount: number, plan: UserPlan = 'free'): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return (currentCount + newCount) <= limits.maxContacts;
}

export function canUseVpsDaemon(plan: UserPlan = 'free'): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits.allowsVpsDaemon;
}

export function canRotateMailboxes(plan: UserPlan = 'free'): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits.allowsMultiMailboxRotation;
}

export function canUseClientReports(plan: UserPlan = 'free'): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return limits.allowsClientReports;
}
