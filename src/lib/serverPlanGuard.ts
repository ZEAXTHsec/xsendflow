import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS, UserPlan } from './planLimits';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export interface PlanGuardResult {
  allowed: boolean;
  plan: UserPlan;
  error?: string;
  currentCount?: number;
  maxLimit?: number;
}

/**
 * Server-side zero-trust assertion for user plan permissions and quotas
 */
export async function assertServerPlanPermission(
  userId: string,
  action: 'create_mailbox' | 'launch_campaign' | 'import_leads' | 'trigger_vps' | 'send_email' | 'client_reports'
): Promise<PlanGuardResult> {
  try {
    // If running in local dev without supabase credentials, allow default dev plan
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return { allowed: true, plan: 'pro' };
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('plan, daily_sent_count, last_sent_reset_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { allowed: true, plan: 'free' };
    }

    const plan: UserPlan = (profile.plan as UserPlan) || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // 1. Mailbox limit check
    if (action === 'create_mailbox') {
      const { count } = await supabaseAdmin
        .from('mailboxes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if ((count || 0) >= limits.maxMailboxes) {
        return {
          allowed: false,
          plan,
          error: `TIER_LIMIT: Free plan allows maximum 1 connected mailbox. Upgrade to Pro for unlimited.`,
          currentCount: count || 0,
          maxLimit: limits.maxMailboxes
        };
      }
    }

    // 2. Active Campaign limit check (Free: 1, Pro: 5, Agency: Unlimited)
    if (action === 'launch_campaign') {
      const { count } = await supabaseAdmin
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['in_progress', 'sending']);

      const maxActive = plan === 'free' ? 1 : plan === 'pro' ? 5 : 99999;
      if ((count || 0) >= maxActive) {
        return {
          allowed: false,
          plan,
          error: `TIER_LIMIT: ${plan === 'free' ? 'Free plan allows 1 active campaign at a time' : 'Pro plan allows up to 5 active campaigns'}. Pause an existing campaign or upgrade.`,
          currentCount: count || 0,
          maxLimit: maxActive
        };
      }
    }

    // 3. Daily email quota check
    if (action === 'send_email') {
      const lastReset = profile.last_sent_reset_at ? new Date(profile.last_sent_reset_at) : new Date(0);
      const today = new Date();
      const isNewDay = lastReset.getUTCDate() !== today.getUTCDate() || lastReset.getUTCMonth() !== today.getUTCMonth() || lastReset.getUTCFullYear() !== today.getUTCFullYear();

      const currentDailySent = isNewDay ? 0 : (profile.daily_sent_count || 0);

      if (plan === 'free' && currentDailySent >= 50) {
        return {
          allowed: false,
          plan,
          error: 'TIER_LIMIT: Free tier daily limit of 50 emails reached. Resets at 00:00 UTC or upgrade to Pro for unlimited.',
          currentCount: currentDailySent,
          maxLimit: 50
        };
      }
    }

    // 4. VPS Daemon permission check
    if (action === 'trigger_vps') {
      if (!limits.allowsVpsDaemon) {
        return {
          allowed: false,
          plan,
          error: 'TIER_LIMIT: 24/7 Headless VPS Cloud Worker requires Pro or Agency plan.'
        };
      }
    }

    // 5. Client reports permission check
    if (action === 'client_reports') {
      if (plan !== 'agency') {
        return {
          allowed: false,
          plan,
          error: 'TIER_LIMIT: Shareable live client reports are exclusively available on the Agency Scale plan.'
        };
      }
    }

    return { allowed: true, plan };
  } catch (err: any) {
    console.error('assertServerPlanPermission error:', err);
    return { allowed: true, plan: 'free' };
  }
}
