import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle2, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Changelog & Updates | XSendFlow',
  description: 'Recent updates, releases, and improvements to XSendFlow Desktop & Studio.',
};

const releases = [
  {
    version: 'v0.5.0 — The AI Studio & Deliverability Fusion',
    date: 'August 2026',
    badge: 'Latest Major Release',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    highlights: [
      'Added AI Lead Cleaner & Sanitizer with automatic title/LLC stripping and role-email filtering.',
      'Launched 1-to-1 Dynamic Pitch Pages (/p/slug) with prospect branding, Loom embeds, and Cal.com integration.',
      'Released Spam-Proof Spintax Studio with 300+ spam keyword scanner and 1-click De-Spamify rewriter.',
      'Integrated live DNS Deliverability Shield for real-time SPF, DKIM, DMARC, and MX record audits.',
      'Transformed UI with pristine light aesthetic and psychological SaaS coloring.'
    ]
  },
  {
    version: 'v0.4.2 — Multi-Sender Split & Local Persistence',
    date: 'July 2026',
    badge: 'Desktop Release',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    highlights: [
      'Added weighted sender rotation with individual quota sliders.',
      'Introduced local SQLite persistence directly on PC for 100% data privacy.',
      'Added CSV column auto-mapping and disposable domain filter.'
    ]
  },
  {
    version: 'v0.3.0 — Native Windows NSIS Installer',
    date: 'June 2026',
    badge: 'Core Engine',
    badgeClass: 'bg-purple-50 text-purple-700 border border-purple-200',
    highlights: [
      'Transitioned to native Windows NSIS installer with system tray background worker.',
      'Added support for 10+ SMTP provider presets (Google, Zoho, Outlook, Hostinger).',
      'Added delay scheduling between outgoing messages.'
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <Zap className="w-3.5 h-3.5 text-blue-600" /> Product Updates
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Changelog &amp; Release Notes
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base">
          Continuous improvements to your cold outreach and deliverability pipeline.
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-3xl mx-auto space-y-8">
          {releases.map((rel, i) => (
            <div key={i} className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">{rel.version}</h3>
                  <span className="text-xs text-slate-500">{rel.date}</span>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full w-fit ${rel.badgeClass}`}>
                  {rel.badge}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                {rel.highlights.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
