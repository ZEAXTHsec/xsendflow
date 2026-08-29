export type UserPlan = 'free' | 'pro' | 'agency';

export interface PlanFeatureLimits {
  name: string;
  priceMonthly: number;
  priceLifetime: number;
  maxMailboxes: number;
  maxContacts: number;
  dailySendLimit: number;
  allowsVpsDaemon: boolean;
  aiIcebreakerLimit: number;
  allowsMultiMailboxRotation: boolean;
  canExportUnlimitedCsv: boolean;
}

export const PLAN_LIMITS: Record<UserPlan, PlanFeatureLimits> = {
  free: {
    name: 'Free Forever',
    priceMonthly: 0,
    priceLifetime: 0,
    maxMailboxes: 1,
    maxContacts: 250,
    dailySendLimit: 50,
    allowsVpsDaemon: false,
    aiIcebreakerLimit: 10,
    allowsMultiMailboxRotation: false,
    canExportUnlimitedCsv: false,
  },
  pro: {
    name: 'Pro Unlimited',
    priceMonthly: 29,
    priceLifetime: 199,
    maxMailboxes: 9999,
    maxContacts: 999999,
    dailySendLimit: 999999,
    allowsVpsDaemon: true,
    aiIcebreakerLimit: 999999,
    allowsMultiMailboxRotation: true,
    canExportUnlimitedCsv: true,
  },
  agency: {
    name: 'Agency Scale',
    priceMonthly: 79,
    priceLifetime: 499,
    maxMailboxes: 99999,
    maxContacts: 9999999,
    dailySendLimit: 9999999,
    allowsVpsDaemon: true,
    aiIcebreakerLimit: 9999999,
    allowsMultiMailboxRotation: true,
    canExportUnlimitedCsv: true,
  },
};

export function canAddMailbox(currentCount: number, plan: UserPlan = 'free'): boolean {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  return currentCount < limits.maxMailboxes;
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
