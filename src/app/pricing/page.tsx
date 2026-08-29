'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, Sparkles, Zap, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscribedPlan, setSubscribedPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string, amount: number, planName: string) => {
    setLoadingPlan(planId);
    try {
      // 1. Create order on server
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          amount,
          currency: 'USD'
        })
      });

      const orderData = await res.json();
      if (!orderData.success) {
        alert(orderData.error || 'Could not initiate checkout.');
        setLoadingPlan(null);
        return;
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId || 'rzp_live_STudsDAainFSIM',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'XSendFlow Deliverability',
        description: `${planName} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify payment signature on server
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId
            })
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setSubscribedPlan(planId);
            try { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); } catch {}
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: 'Growth Leader',
          email: 'outreach@company.com',
          contact: ''
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        alert('Payment failed: ' + resp.error.description);
      });
      rzp.open();
    } catch (err: any) {
      alert('Checkout error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Header />

      <section className="pt-24 pb-12 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Honest &amp; Transparent Pricing</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          AI Studio is Free. Scale When You Need.
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          No \$200/mo arbitrary markups. Get the full AI cold email deliverability suite free, with dedicated 24/7 cloud sending servers on demand.
        </p>
      </section>

      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tier 1: Free AI Deliverability Studio */}
          <div className="bg-white p-8 rounded-3xl border-2 border-indigo-600 shadow-xl space-y-6 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase px-3.5 py-0.5 rounded-full shadow-md">
              Free Forever
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                AI Studio
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Deliverability Suite</h3>
                <div className="text-3xl font-black text-indigo-600">$0 <span className="text-xs font-normal text-slate-500">/ web browser</span></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full access to lead sanitization, spam keyword detection, Spintax generator, 1-to-1 dynamic pitch pages, and DNS health shield.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> AI Lead Cleaner &amp; Icebreakers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Real-time 300+ Spam Word Scanner</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> 1-Click &quot;De-Spamify&quot; Rewriter</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Dynamic 1-to-1 Pitch Pages (/p/slug)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Live DNS Shield (SPF/DKIM/DMARC)</li>
              </ul>
            </div>
            <Link
              href="/studio"
              className="w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 glow-tag flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Launch Free Studio in Browser →</span>
            </Link>
          </div>

          {/* Tier 2: 24/7 Cloud Worker Add-On */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-lg transition-all relative">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Cloud Sending Server</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">24/7 Headless Worker</h3>
                <div className="text-3xl font-black text-slate-900">$14 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sends campaigns continuously in the cloud even when your laptop is closed. Includes open/click tracking and warmup pools.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> 24/7 background sending VPS daemon</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> Open &amp; link click tracking pixels</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> Multi-mailbox sender rotation pool</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> Unified Supabase multi-tenant isolation</li>
              </ul>
            </div>

            {subscribedPlan === 'cloud_worker_14' ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Subscribed &amp; Active!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleCheckout('cloud_worker_14', 14, '24/7 Cloud Worker')}
                disabled={loadingPlan === 'cloud_worker_14'}
                className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>{loadingPlan === 'cloud_worker_14' ? 'Initiating Checkout...' : 'Upgrade with 1-Click Razorpay →'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
