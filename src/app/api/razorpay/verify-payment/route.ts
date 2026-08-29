import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, userEmail } = await req.json();

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

    console.log(`[+] [Razorpay Verified] User ${userEmail || 'Customer'} successfully subscribed to plan: ${planId} (Payment ID: ${razorpay_payment_id})`);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      planId
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
