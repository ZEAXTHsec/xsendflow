import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { planId, amount, currency = 'USD', userId, userEmail } = await req.json();

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_STudsDAainFSIM';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rAY0ejs6KVokpPM3QuBOmxXc';

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    // Amount in smallest currency unit (cents or paise)
    const amountInSubunits = Math.round(Number(amount) * 100);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency: currency.toUpperCase(),
        receipt: `rcpt_${planId}_${Date.now()}`,
        notes: {
          plan: planId,
          userId: userId || '',
          userEmail: userEmail || '',
          app: 'XSendFlow'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.error?.description || 'Failed to create order' }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: keyId
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
