import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { UploadCloud, Sparkles, Zap, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How it Works — The Clean Cold Email Pipeline | XSendFlow',
  description: 'How to clean leads, generate spam-proof Spintax, audit DNS, and send cold emails with XSendFlow.',
};

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Upload Raw Leads to AI Studio',
      desc: 'Drop in your Apollo, LinkedIn, or Google Maps CSV. The engine strips all-caps formatting, cleans legal entity suffixes (LLC, Inc.), and flags invalid spam traps before they harm your domain.',
      icon: UploadCloud,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      num: '02',
      title: 'Generate Personalized Hooks & 1-to-1 Pitch Pages',
      desc: 'AI generates a tailored 1-sentence opening line for each prospect and generates dedicated micro-landing pages (/p/stripe-john) with custom value bullets and Loom video embeds.',
      icon: Sparkles,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      num: '03',
      title: 'Draft Spam-Proof Copy with Automated Spintax',
      desc: 'Scan against 300+ spam keywords in real-time. Use 1-click De-Spamify and wrap your sentences in {Hey|Hi|Hello} Spintax variations so no two outgoing messages have identical hashes.',
      icon: Zap,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      num: '04',
      title: 'Audit DNS Health & Export Ready-to-Send Campaign',
      desc: 'Run a 1-click audit on your sending domains (SPF, DKIM, DMARC, MX). Export formatted CSVs with unique Spintax hashes ready to inbox with 100% deliverability in any sending tool.',
      icon: ShieldCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          The 4-Step Pipeline
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          How the XSendFlow Pipeline Works
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base">
          From dirty lead list to 100% inbox placement in under 3 minutes.
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step) => (
            <div key={step.num} className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-start gap-6 hover:bg-white hover:shadow-lg transition-all">
              <div className={`w-14 h-14 rounded-2xl ${step.bg} border border-slate-200 flex flex-col items-center justify-center shrink-0`}>
                <span className={`text-xs font-mono font-black ${step.color}`}>{step.num}</span>
                <step.icon className={`w-5 h-5 mt-0.5 ${step.color}`} />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}

          <div className="text-center pt-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/studio"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 active:scale-95 glow-tag"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Launch AI Deliverability Studio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
