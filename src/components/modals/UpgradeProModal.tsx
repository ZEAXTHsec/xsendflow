'use client';

import React, { useState } from 'react';
import { 
  X, Zap, CheckCircle2, ShieldCheck, Mail, Users, 
  Cpu, ArrowRight, Sparkles, Lock, Star, Building2, Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoIcon } from '../ui/Logo';
import { UserPlan } from '@/lib/planLimits';
import { createDefaultLicense } from '@/lib/licenseEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: 
    | 'mailbox_limit' 
    | 'campaign_limit' 
    | 'pro_campaign_limit' 
    | 'contact_limit' 
    | 'vps_daemon' 
    | 'bulk_ai' 
    | 'client_reports' 
    | 'general';
  targetTier?: 'pro' | 'agency';
  userEmail?: string;
  userId?: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UpgradeProModal({ 
  isOpen, 
  onClose, 
  triggerReason = 'general', 
  targetTier = 'pro',
  userEmail, 
  userId,
  onSuccess 
}: Props) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'agency'>(targetTier);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const triggerCopy = {
    mailbox_limit: {
      title: 'Unlock Multi-Mailbox Rotation',
      desc: 'Free plan includes 1 mailbox. Upgrade to Pro to connect and rotate unlimited Google Workspace & Hostinger inboxes to protect your domain reputation.'
    },
    campaign_limit: {
      title: 'Upgrade to Manage Multiple Campaigns',
      desc: 'Free tier is limited to 1 campaign total. Upgrade to Pro ($29/mo) to create, clone, and run up to 5 campaigns simultaneously, or delete your existing campaign.'
    },
    pro_campaign_limit: {
      title: 'Scale to Unlimited Active Campaigns',
      desc: 'Pro plan supports 5 concurrent active campaigns. Upgrade to Agency Scale to launch unlimited campaigns across multiple client fleets.'
    },
    contact_limit: {
      title: 'Scale Beyond 250 Contacts',
      desc: 'Free plan includes 250 verified contacts in your database. Upgrade to Pro to import and launch campaigns to unlimited leads.'
    },
    vps_daemon: {
      title: 'Unlock 24/7 Cloud-Powered Background Sending',
      desc: 'Free plan dispatches while your browser is open. Pro unlocks our dedicated 24/7/365 cloud queue engine so your campaigns dispatch autonomously while your laptop is closed.'
    },
    bulk_ai: {
      title: 'Unlock Bulk AI Icebreaker Enrichment',
      desc: 'Free tier allows 10 sample AI icebreakers. Upgrade to Pro to enrich thousands of leads with personalized hooks in 1 click.'
    },
    client_reports: {
      title: 'Shareable Live Client Reports',
      desc: 'Agency Scale unlocks private, branded report URLs (/report/[token]) you can share directly with clients to showcase live ROI and open rates.'
    },
    general: {
      title: 'Unlock Unlimited Outbound Scale',
      desc: 'Everything you need to send 25,000+ cold emails/mo with 99% inboxing and zero domain penalties.'
    }
  }[triggerReason];

  const planPricing = {
    pro: {
      name: 'Pro Unlimited',
      monthly: 29,
      annual: 249,
      badge: 'Most Popular',
      desc: 'For founders & growth teams scaling outbound',
      features: [
        'Unlimited Connected Mailboxes',
        'Up to 5 Simultaneous Active Campaigns',
        '24/7 Cloud-Powered Background Dispatch',
        'Unlimited Contacts & Real-time Verification',
        'Multi-Step Spintax & AI Icebreakers'
      ]
    },
    agency: {
      name: 'Agency Scale',
      monthly: 79,
      annual: 690,
      badge: 'Agencies & Teams',
      desc: 'For agencies running multi-client fleets',
      features: [
        'Everything in Pro Unlimited',
        'Unlimited Simultaneous Active Campaigns',
        'Multi-Client Workspace Isolation',
        'Shareable Live Client Reports (/report/[token])',
        'Dedicated High-Throughput Cloud Sockets'
      ]
    }
  }[selectedPlan];

  const currentPrice = billingCycle === 'monthly' ? planPricing.monthly : planPricing.annual;

  const handleRazorpayCheckout = async () => {
    setLoading(true);
    try {
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentPrice,
          planId: selectedPlan,
          plan: selectedPlan,
          billingCycle,
          userEmail,
          userId: userId || null
        })
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Could not initiate Razorpay order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_STudsDAainFSIM',
        amount: orderData.amount,
        currency: 'USD',
        name: 'XSendFlow',
        description: `${planPricing.name} (${billingCycle})`,
        order_id: orderData.orderId,
        prefill: {
          email: userEmail || 'user@example.com'
        },
        theme: {
          color: selectedPlan === 'agency' ? '#9333ea' : '#6366f1'
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: selectedPlan,
                userEmail,
                userId: userId || null
              })
            });

            if (verifyRes.ok) {
              try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } }); } catch {}
              if (typeof window !== 'undefined') {
                localStorage.setItem('xsendflow_user_plan', selectedPlan);
                createDefaultLicense(selectedPlan as UserPlan, billingCycle);
                window.dispatchEvent(new Event('xsendflow_plan_updated'));
                window.dispatchEvent(new Event('xsendflow_license_updated'));
              }
              onSuccess?.();
              onClose();
              alert(`🎉 Payment Successful! Your account has been upgraded to ${planPricing.name}!`);
            }
          } catch (err) {
            console.error('Verification error:', err);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0f19] border border-slate-800/90 text-white shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 transform-gpu will-change-transform">
        
        {/* Subtle Ambient Radial Highlight */}
        <div className="absolute top-0 right-1/4 w-80 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-4 border-b border-slate-800/70 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Scale &amp; Growth Plan</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">{triggerCopy.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md pt-0.5">{triggerCopy.desc}</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Upgrade Modal"
            id="close-upgrade-modal-btn"
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Selector Radio Cards (Zero-Layout-Shift, Instant Feedback) */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          {/* Pro Plan Card */}
          <button
            type="button"
            onClick={() => setSelectedPlan('pro')}
            className={`p-3.5 rounded-2xl text-left transition-all duration-150 border relative flex flex-col justify-between ${
              selectedPlan === 'pro'
                ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-white shadow-md shadow-indigo-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1 text-white">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" /> Pro Unlimited
                </span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  selectedPlan === 'pro' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                }`}>
                  {selectedPlan === 'pro' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Solo founders &amp; teams</p>
            </div>

            <div className="pt-3 flex items-baseline gap-1">
              <span className="text-lg font-black text-white font-mono tracking-tight">
                ${billingCycle === 'monthly' ? '29' : '249'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
          </button>

          {/* Agency Plan Card */}
          <button
            type="button"
            onClick={() => setSelectedPlan('agency')}
            className={`p-3.5 rounded-2xl text-left transition-all duration-150 border relative flex flex-col justify-between ${
              selectedPlan === 'agency'
                ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 text-white shadow-md shadow-purple-950/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1 text-white">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" /> Agency Scale
                </span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  selectedPlan === 'agency' ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                }`}>
                  {selectedPlan === 'agency' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Agencies &amp; multi-client</p>
            </div>

            <div className="pt-3 flex items-baseline gap-1">
              <span className="text-lg font-black text-white font-mono tracking-tight">
                ${billingCycle === 'monthly' ? '79' : '690'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
          </button>
        </div>

        {/* Feature Matrix Included */}
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-2.5 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Included in {planPricing.name}:
            </span>
            <span className="text-[10px] font-mono text-indigo-300 font-bold">
              {planPricing.badge}
            </span>
          </div>
          <div className="space-y-1.5">
            {planPricing.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-200 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Frequency Switcher (Clean Segmented Control) */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-xs relative z-10">
          <span className="text-slate-300 font-bold pl-1">Billing Term:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/90">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors duration-150 ${
                billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors duration-150 flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual</span>
              <span className="text-[9px] bg-emerald-400 text-slate-950 px-1.5 py-0.2 rounded font-black tracking-wide">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Checkout CTA */}
        <button
          type="button"
          disabled={loading}
          onClick={handleRazorpayCheckout}
          className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all duration-150 relative z-10"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>
            {loading ? 'Initiating Checkout...' : `Upgrade to ${planPricing.name} • $${currentPrice} / ${billingCycle === 'monthly' ? 'month' : 'year'}`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Security / Guarantee Footer */}
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 relative z-10 pt-1">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL
          </span>
          <span>•</span>
          <span>Instant Auto-Activation</span>
          <span>•</span>
          <span>Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
}
