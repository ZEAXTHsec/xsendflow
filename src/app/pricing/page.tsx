import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing — Free AI Studio & Transparent Cloud Add-ons | XSendFlow',
  description: 'AI Deliverability Studio is free in browser. Cloud sending worker add-ons available.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          Honest &amp; Transparent
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          AI Studio is Free. Servers Cost Real Money.
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base">
          We don&apos;t inflate prices by 1000% to pretend cold email preparation and deliverability is rocket science.
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tier 1: Free AI Deliverability Studio */}
          <div className="bg-white p-8 rounded-3xl border-2 border-indigo-600 shadow-xl space-y-6 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase px-3.5 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                AI Studio
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Deliverability Suite</h3>
                <div className="text-3xl font-black text-indigo-600">Free <span className="text-xs font-normal text-slate-500">/ web browser</span></div>
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
              <span>Launch Studio in Browser →</span>
            </Link>
          </div>

          {/* Tier 2: Server Add-On */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-lg transition-all">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                Server Add-On
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">24/7 Cloud Worker</h3>
                <div className="text-3xl font-black text-slate-900">$14 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sends campaigns continuously in the cloud even when your laptop is closed. Includes open/click tracking and warmup pools.
              </p>
              <ul className="space-y-2.5 text-xs text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> 24/7 background sending VPS</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> Open &amp; link click tracking pixels</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> Automated peer-to-peer warmup</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-800 shrink-0" /> Unified IMAP master inbox</li>
              </ul>
            </div>
            <Link
              href="/coffee"
              className="w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3.5 rounded-xl border border-slate-200 transition-all"
            >
              Learn More / Upgrade
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
