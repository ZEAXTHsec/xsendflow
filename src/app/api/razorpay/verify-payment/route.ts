import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, userEmail, userId } = await req.json();

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rAY0ejs6KVokpPM3QuBOmxXc';

    // Verify HMAC SHA-256 signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature' }, { status: 400 });
    }

    const targetPlan = (planId || 'pro').toLowerCase().includes('agency') ? 'agency' : 'pro';

    // Update Supabase Profiles
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const supabase = createAdminClient();
      if (userId) {
        await supabase.from('profiles').update({ plan: targetPlan, updated_at: new Date().toISOString() }).eq('id', userId);
      } else if (userEmail) {
        await supabase.from('profiles').update({ plan: targetPlan, updated_at: new Date().toISOString() }).eq('email', userEmail);
      }
    } catch (dbErr: any) {
      console.warn('[!] Could not update profile in DB directly from verify-payment:', dbErr.message);
    }

    console.log(`[+] [Razorpay Verified] User ${userEmail || userId || 'Customer'} successfully subscribed to plan: ${targetPlan} (Payment ID: ${razorpay_payment_id})`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      planId: targetPlan
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
