'use client';

import React, { useState } from 'react';
import { 
  X, Zap, CheckCircle2, ShieldCheck, Mail, Users, 
  Cpu, ArrowRight, Sparkles, Lock, Star, Building2, Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoIcon } from '../ui/Logo';
import { UserPlan } from '@/lib/planLimits';

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
      title: 'Run Multiple Active Campaigns',
      desc: 'Free tier supports 1 active campaign at a time. Pause your running campaign or upgrade to Pro to launch up to 5 simultaneous campaigns.'
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
      features: [
        'Unlimited Connected Mailboxes',
        '24/7 Cloud-Powered Background Dispatch',
        'Up to 5 Simultaneous Active Campaigns',
        'Unlimited Contacts & Bulk AI Enrichment'
      ]
    },
    agency: {
      name: 'Agency Scale',
      monthly: 79,
      annual: 690,
      features: [
        'Everything in Pro Unlimited',
        'Unlimited Active Campaigns',
        'Multi-Client Workspace Isolation',
        'Shareable Live Client Reports (/report/[token])',
        'Dedicated Cloud Engine Routing & Sockets'
      ]
    }
  }[selectedPlan];

  const currentPrice = billingCycle === 'monthly' ? planPricing.monthly : planPricing.annual;

  const handleRazorpayCheckout = async () => {
    setLoading(true);
    try {
      // 1. Ensure Razorpay script loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      // 2. Create Order
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

      // 3. Open Razorpay Modal
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
                window.dispatchEvent(new Event('xsendflow_plan_updated'));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0b101b] border border-slate-800 text-white shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon size="md" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Enterprise Gating &amp; Scale</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">{triggerCopy.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Upgrade Modal"
            id="close-upgrade-modal-btn"
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trigger Context Description */}
        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          {triggerCopy.desc}
        </p>

        {/* Tier Selector (Pro vs Agency) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 relative z-10">
          <button
            type="button"
            onClick={() => setSelectedPlan('pro')}
            className={`p-3.5 rounded-xl text-left transition-all border ${
              selectedPlan === 'pro'
                ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" /> Pro Unlimited
              </span>
              <span className="text-xs font-black text-indigo-300">$29/mo</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">For founders &amp; growth leaders</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan('agency')}
            className={`p-3.5 rounded-xl text-left transition-all border relative ${
              selectedPlan === 'agency'
                ? 'bg-purple-600/15 border-purple-500 text-white shadow-md'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-purple-500 text-white font-mono font-bold text-[8px] uppercase">
              Agencies
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-purple-400" /> Agency Scale
              </span>
              <span className="text-xs font-black text-purple-300">$79/mo</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Multi-client &amp; team workspaces</p>
          </button>
        </div>

        {/* Selected Tier Feature Matrix */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 relative z-10">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Included in {planPricing.name}:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {planPricing.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs relative z-10">
          <span className="text-slate-300 font-semibold">Billing Frequency:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400'
              }`}
            >
              Monthly (${selectedPlan === 'pro' ? '29' : '79'}/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 ${
                billingCycle === 'annual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400'
              }`}
            >
              <span>Annual</span>
              <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* 1-Click Razorpay Checkout Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleRazorpayCheckout}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 active:scale-95 transition-all relative z-10"
        >
          <Zap className="w-4 h-4 text-cyan-300" />
          <span>{loading ? 'Initiating Razorpay...' : `Upgrade to ${planPricing.name} — $${currentPrice} / ${billingCycle === 'monthly' ? 'month' : 'year'}`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 relative z-10">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit TLS
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
