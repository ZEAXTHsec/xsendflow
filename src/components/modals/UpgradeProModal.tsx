'use client';

import React, { useState } from 'react';
import { 
  X, Zap, CheckCircle2, ShieldCheck, Mail, Users, 
  Cpu, ArrowRight, Sparkles, Lock, Star 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LogoIcon } from '../ui/Logo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  triggerReason?: 'mailbox_limit' | 'contact_limit' | 'vps_daemon' | 'bulk_ai' | 'general';
  userEmail?: string;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UpgradeProModal({ isOpen, onClose, triggerReason = 'general', userEmail, onSuccess }: Props) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const triggerCopy = {
    mailbox_limit: {
      title: 'Unlock Multi-Mailbox Rotation',
      desc: 'Free plan includes 1 mailbox. Upgrade to Pro to connect and rotate unlimited Google Workspace & Hostinger inboxes to protect your domain reputation.'
    },
    contact_limit: {
      title: 'Scale Beyond 250 Contacts',
      desc: 'You have reached the 250 contact limit on the Free tier. Upgrade to Pro to import and launch campaigns to unlimited leads.'
    },
    vps_daemon: {
      title: 'Unlock 24/7 Cloud Background Sending',
      desc: 'Free plan dispatches while your browser is open. Pro unlocks our dedicated 24/7/365 Oracle VPS queue worker so your campaigns dispatch while you sleep.'
    },
    bulk_ai: {
      title: 'Unlock Bulk AI Icebreaker Enrichment',
      desc: 'Free tier allows 10 sample AI icebreakers. Upgrade to Pro to enrich thousands of leads with personalized hooks in 1 click.'
    },
    general: {
      title: 'Unlock Unlimited Outbound Scale',
      desc: 'Everything you need to send 25,000+ cold emails/mo with 99% inboxing and zero domain penalties.'
    }
  }[triggerReason];

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

      const amount = billingCycle === 'monthly' ? 29 : 290;
      const planName = billingCycle === 'monthly' ? 'XSendFlow Pro (Monthly)' : 'XSendFlow Pro (Annual)';

      // 2. Create Order
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          plan: 'pro',
          billingCycle
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
        description: planName,
        order_id: orderData.orderId,
        prefill: {
          email: userEmail || 'user@example.com'
        },
        theme: {
          color: '#6366f1'
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                plan: 'pro'
              })
            });

            if (verifyRes.ok) {
              try { confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } }); } catch {}
              if (typeof window !== 'undefined') {
                localStorage.setItem('xsendflow_user_plan', 'pro');
              }
              onSuccess?.();
              onClose();
              alert('🎉 Payment Successful! Your account has been upgraded to XSendFlow Pro!');
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
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0b101b] border border-slate-800 text-white shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon size="md" />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-cyan-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Unlimited Scale</span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">{triggerCopy.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trigger Context Description */}
        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          {triggerCopy.desc}
        </p>

        {/* Feature Matrix */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 relative z-10">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            What You Unlock with XSendFlow Pro:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited Inboxes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>24/7 VPS Background Daemon</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited Contacts &amp; Campaigns</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bulk AI Enrichment</span>
            </div>
          </div>
        </div>

        {/* Billing Cycle Switcher */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 relative z-10">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
              billingCycle === 'monthly'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Monthly Plan</span>
            <span className="text-sm font-black">$29 <span className="text-[10px] font-normal text-slate-200">/ month</span></span>
          </button>

          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 relative ${
              billingCycle === 'annual'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="absolute -top-2.5 right-2 px-2 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
              2 Months Free
            </span>
            <span>Annual Plan</span>
            <span className="text-sm font-black">$24 <span className="text-[10px] font-normal text-slate-200">/ mo ($290/yr)</span></span>
          </button>
        </div>

        {/* 1-Click Razorpay Checkout Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleRazorpayCheckout}
          className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 active:scale-95 transition-all relative z-10"
        >
          <Zap className="w-4 h-4 text-cyan-300" />
          <span>{loading ? 'Initiating Razorpay...' : `Upgrade to Pro — ${billingCycle === 'monthly' ? '$29 / month' : '$290 / year'}`}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 relative z-10">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure 256-bit SSL
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
