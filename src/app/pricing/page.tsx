'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, Sparkles, Zap, ShieldCheck, CreditCard, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createDefaultLicense } from '@/lib/licenseEngine';
import { UserPlan } from '@/lib/planLimits';

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
            const targetPlan: UserPlan = planId.toLowerCase().includes('agency') ? 'agency' : 'pro';
            if (typeof window !== 'undefined') {
              localStorage.setItem('xsendflow_user_plan', targetPlan);
              createDefaultLicense(targetPlan, 'monthly');
              window.dispatchEvent(new Event('xsendflow_plan_updated'));
              window.dispatchEvent(new Event('xsendflow_license_updated'));
            }
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Free Forever */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-md transition-all relative">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                Starter Tier
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">Free Forever</h3>
                <div className="text-3xl font-black text-slate-900">$0 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Everything you need to verify deliverability and book your first 2–3 sales calls for $0.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 1 Connected Mailbox (Google / Hostinger)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 50 Outbound Emails / Day</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> 250 Contacts in Lead Database</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> FSM Nested Spintax Generator</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Real-time 300+ Spam Word Scanner</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0" /> Direct Excel / Sheets Paste Box</li>
              </ul>
            </div>
            <Link
              href="/studio"
              className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Launch Free Studio →</span>
            </Link>
          </div>

          {/* Tier 2: Pro Unlimited (Most Popular) */}
          <div className="bg-white p-7 rounded-3xl border-2 border-indigo-600 shadow-xl space-y-6 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase px-3.5 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Unlimited Outbound Scale</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">Pro Unlimited</h3>
                <div className="text-3xl font-black text-indigo-600">$29 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scale your pipeline without burning domains. Rotate unlimited mailboxes with 24/7 cloud sending.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> <strong>Unlimited Connected Mailboxes</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> <strong>24/7 Cloud-Powered Background Queue</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Unlimited Contacts &amp; Campaigns</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Multi-Mailbox Weighted Rotation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Bulk AI Icebreaker Enrichment</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-600 shrink-0" /> Open &amp; Link Click Tracking</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout('pro_monthly_29', 29, 'XSendFlow Pro')}
              disabled={loadingPlan === 'pro_monthly_29'}
              className="w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>{loadingPlan === 'pro_monthly_29' ? 'Initiating Checkout...' : 'Upgrade to Pro ($29/mo) →'}</span>
            </button>
          </div>

          {/* Tier 3: Agency Scale */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-lg transition-all relative">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                <span>Agencies &amp; Growth Teams</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">Agency Scale</h3>
                <div className="text-3xl font-black text-slate-900">$79 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For agencies managing cold outreach across 10+ clients and high-volume sending fleets.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Everything in Pro Unlimited</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Multi-Client Workspace Isolation</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Dedicated Cloud Engine Outbound Routing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Team Seats &amp; Granular Roles</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-600 shrink-0" /> Priority 1-on-1 Deliverability Audit</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleCheckout('agency_monthly_79', 79, 'XSendFlow Agency')}
              disabled={loadingPlan === 'agency_monthly_79'}
              className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{loadingPlan === 'agency_monthly_79' ? 'Initiating Checkout...' : 'Upgrade to Agency ($79/mo) →'}</span>
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
