import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, ShieldCheck, Zap, ArrowRight, CheckCircle2, Monitor } from 'lucide-react';
import { LogoIcon } from '@/components/ui/Logo';

export const metadata: Metadata = {
  title: 'XSendFlow — Free Cold Email Acceleration & AI Deliverability Studio',
  description: 'Stop paying $79–149/mo for email software. Clean leads, generate spam-proof Spintax, build 1-to-1 pitch pages, and audit DNS health.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 overflow-hidden text-center">
        {/* Soft Ambient Multi-Color Mesh Glows (Blue, Purple, Mint) */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-blue-200/40 blur-[110px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Logo Badge */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-slate-900 text-white shadow-xl shadow-indigo-500/10 border border-slate-800">
              <LogoIcon size="sm" />
              <span className="text-xs font-mono font-bold tracking-tight text-slate-200">
                XSendFlow 2.0 • Zero-Cost Cold Email Engine
              </span>
            </div>
          </div>

          {/* Eyebrow Callout - Psychological Urgency Red */}
          <div className="inline-block text-xs sm:text-sm font-bold text-rose-600 tracking-tight">
            Stop paying $79–149/month for basic sending tools
          </div>

          {/* Hero Heading */}
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
            Send unlimited cold<br />
            emails.<br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Free. Forever.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            That&apos;s $1,000–$1,800 a year your competitors burn on email tools. You&apos;ll spend zero. Clean dirty leads, generate spam-proof Spintax sequences, and protect your domain reputation.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <Link
              href="/studio"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95 glow-tag"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>Launch AI Studio — Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold px-7 py-3.5 rounded-xl text-sm border border-slate-200 shadow-sm transition-all active:scale-95"
            >
              <span>How It Works ↓</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="text-xs text-slate-600 pt-1 font-medium flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant in-browser access</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% private &amp; local</span>
          </div>
        </div>
      </section>

      {/* ═══ COMPETITOR COMPARISON SECTION ═══ */}
      <section className="py-20 px-4 sm:px-6 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-4xl mx-auto space-y-8 text-center">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Email software shouldn&apos;t cost more than your email hosting
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Think about it. You pay $6/month for Google Workspace. Then some SaaS charges you $79/month — to send emails <em>through the account you already pay for</em>. That&apos;s backwards.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-1">
              <span className="text-xs text-slate-600 font-semibold line-through">Mailshake</span>
              <div className="text-2xl font-black text-rose-500">$79<span className="text-xs font-normal text-slate-600">/mo</span></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-1">
              <span className="text-xs text-slate-600 font-semibold line-through">Instantly</span>
              <div className="text-2xl font-black text-rose-500">$49<span className="text-xs font-normal text-slate-600">/mo</span></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-1">
              <span className="text-xs text-slate-600 font-semibold line-through">Lemlist</span>
              <div className="text-2xl font-black text-rose-500">$149<span className="text-xs font-normal text-slate-600">/mo</span></div>
            </div>
            <div className="bg-gradient-to-b from-emerald-50 to-white p-5 rounded-2xl border-2 border-emerald-500 shadow-md shadow-emerald-500/10 text-center space-y-1">
              <span className="text-xs text-emerald-700 font-extrabold uppercase tracking-wide">XSendFlow</span>
              <div className="text-2xl font-black text-emerald-600">$0 <span className="text-xs font-bold text-emerald-700">/ Free</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ THE 4 PILLAR DELIVERABILITY STUDIO ═══ */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>AI Deliverability Studio (Included Free)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              4 Pillars to Guarantee 100% Inboxing Rate
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Clean dirty lead lists, eliminate spam keyword triggers, build 1-to-1 dynamic pitch pages, and audit your domains.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 space-y-3.5 hover:bg-white hover:shadow-xl hover:border-blue-300 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. AI Lead Cleaner &amp; Icebreakers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sanitizes raw scraped lists (removes Dr./LLC titles, emojis, uppercase text), filters dangerous role accounts (<code className="text-slate-700 font-mono">admin@</code>, <code className="text-slate-700 font-mono">info@</code>), and generates 1-sentence personalized opening hooks.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 space-y-3.5 hover:bg-white hover:shadow-xl hover:border-emerald-300 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. Spam-Proof Sequence &amp; Spintax Studio</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scans 300+ spam keywords in real-time, calculates Deliverability Safety Score, offers a 1-click <strong>&quot;De-Spamify&quot;</strong> rewriter, and wraps copy in randomized <code className="text-slate-700 font-mono">{'{Hey|Hi}'}</code> Spintax variations.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 space-y-3.5 hover:bg-white hover:shadow-xl hover:border-purple-300 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Monitor className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. Dynamic 1-to-1 Pitch Pages</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generates unique, branded micro-landing pages (<code className="text-slate-700 font-mono">/p/stripe-john</code>) with custom company branding, video walkthrough embeds, and direct Cal.com calendar booking.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-slate-50/70 p-7 rounded-3xl border border-slate-200 space-y-3.5 hover:bg-white hover:shadow-xl hover:border-amber-300 transition-all">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">4. DNS Deliverability Health Shield</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Audits SPF (<code className="text-slate-700 font-mono">v=spf1</code>), DKIM keys, DMARC policies (<code className="text-slate-700 font-mono">p=none/quarantine/reject</code>), and MX routing in real-time with 1-click DNS fix generators for Cloudflare &amp; GoDaddy.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold px-8 py-3.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              <span>Open the AI Studio in Browser</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
