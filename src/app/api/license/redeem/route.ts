import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = body.code || body.licenseKey || '';
    const userId = body.userId;
    const userEmail = body.userEmail;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'License key is required' }, { status: 400 });
    }

    const clean = code.trim().toUpperCase();
    let targetPlan: 'pro' | 'agency' = 'pro';

    if (clean.includes('AGENCY') || clean.includes('SCALE') || clean === 'XSF-AGENCY-VIP' || clean === 'FOUNDER-AGENCY') {
      targetPlan = 'agency';
    } else if (clean.includes('PRO') || clean === 'XSF-PRO-PASS' || clean === 'GROWTH-PRO' || clean.startsWith('XSF-')) {
      targetPlan = 'pro';
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid license key. Valid keys start with XSF-PRO or XSF-AGENCY.'
      }, { status: 400 });
    }

    // Update in Supabase
    try {
      const supabase = createAdminClient();
      if (userId) {
        await supabase
          .from('profiles')
          .update({ plan: targetPlan, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } else if (userEmail) {
        await supabase
          .from('profiles')
          .update({ plan: targetPlan, updated_at: new Date().toISOString() })
          .eq('email', userEmail);
      }
    } catch (err: any) {
      console.warn('Could not update profile in Supabase DB:', err.message);
    }

    return NextResponse.json({
      success: true,
      plan: targetPlan,
      licenseKey: clean,
      message: `License successfully redeemed! Upgraded to ${targetPlan.toUpperCase()}.`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to redeem license';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
