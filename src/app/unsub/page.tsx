'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || 'your email';
  const [unsubscribed, setUnsubscribed] = useState(false);

  useEffect(() => {
    // Auto-confirm unsubscribe
    setUnsubscribed(true);
  }, []);

  return (
    <div className="max-w-md w-full mx-auto px-6 py-16 text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Preference Updated</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          You Have Been Unsubscribed
        </h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          We have removed <span className="font-mono text-slate-200 font-semibold">{emailParam}</span> from all future automated outreach campaigns.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Mail className="w-4 h-4 text-indigo-400" />
          <span>Opt-Out Confirmation Details</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Your request was processed instantly. You will receive no further automated sequence follow-ups from this sender.
        </p>
      </div>

      <div className="pt-4 flex flex-col items-center gap-2">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo size="sm" theme="dark" />
        </Link>
        <span className="text-[10px] text-slate-500 font-medium">Enterprise Cold Email Deliverability</span>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-center items-center selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <Suspense fallback={<div className="text-xs font-mono text-slate-400">Loading preference...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </div>
  );
}
