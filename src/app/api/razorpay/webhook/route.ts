import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rAY0ejs6KVokpPM3QuBOmxXc';

    // 1. Verify Cryptographic Webhook Signature
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('⚠️ [Razorpay Webhook] Invalid webhook signature received.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[+] [Razorpay Webhook] Received verified event: ${event}`);

    const supabase = createAdminClient();

    // 2. Handle Order Paid / Payment Captured
    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity || {};
      const orderEntity = payload.payload?.order?.entity || {};

      const notes = { ...orderEntity.notes, ...paymentEntity.notes };
      const rawPlan = notes.plan || notes.planId || 'pro';
      const targetPlan = rawPlan.toLowerCase().includes('agency') ? 'agency' : 'pro';
      
      const userId = notes.userId || notes.user_id;
      const userEmail = notes.userEmail || notes.user_email || paymentEntity.email;

      console.log(`[+] [Razorpay Webhook] Upgrading user: ${userEmail || userId || 'Unknown'} to Plan: ${targetPlan}`);

      if (userId) {
        // Upgrade by User ID
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: targetPlan,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('[!] [Razorpay Webhook] Error updating profile by ID:', error.message);
        } else {
          console.log(`[✅] [Razorpay Webhook] User ID ${userId} upgraded to ${targetPlan}`);
        }
      } else if (userEmail) {
        // Upgrade by Email
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: targetPlan,
            updated_at: new Date().toISOString(),
          })
          .eq('email', userEmail);

        if (error) {
          console.error('[!] [Razorpay Webhook] Error updating profile by Email:', error.message);
        } else {
          console.log(`[✅] [Razorpay Webhook] User Email ${userEmail} upgraded to ${targetPlan}`);
        }
      }
    }

    // 3. Handle Subscription Charged (Recurring Renewal)
    if (event === 'subscription.charged') {
      const subEntity = payload.payload?.subscription?.entity || {};
      const notes = subEntity.notes || {};
      const rawPlan = notes.plan || 'pro';
      const targetPlan = rawPlan.toLowerCase().includes('agency') ? 'agency' : 'pro';
      const userId = notes.userId;
      const userEmail = notes.userEmail || subEntity.customer_email;

      console.log(`[+] [Razorpay Webhook] Subscription charged for: ${userEmail || userId} (Plan: ${targetPlan})`);

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
    }

    // 4. Handle Subscription Cancelled / Halted
    if (event === 'subscription.cancelled' || event === 'subscription.halted') {
      const subEntity = payload.payload?.subscription?.entity || {};
      const notes = subEntity.notes || {};
      const userId = notes.userId;
      const userEmail = notes.userEmail || subEntity.customer_email;

      console.log(`[!] [Razorpay Webhook] Subscription cancelled for: ${userEmail || userId}. Downgrading to Free.`);

      if (userId) {
        await supabase
          .from('profiles')
          .update({ plan: 'free', updated_at: new Date().toISOString() })
          .eq('id', userId);
      } else if (userEmail) {
        await supabase
          .from('profiles')
          .update({ plan: 'free', updated_at: new Date().toISOString() })
          .eq('email', userEmail);
      }
    }

    return NextResponse.json({ status: 'ok', event });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Webhook handling failed';
    console.error('⚠️ [Razorpay Webhook Error]:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
