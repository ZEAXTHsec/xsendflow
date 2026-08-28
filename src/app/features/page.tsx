import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, RefreshCw, UploadCloud, Edit3, BarChart3, ShieldCheck, Clock, Copy, Moon, Monitor, Check, Sparkles, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features — Everything Ships Free | XSendFlow',
  description: 'SMTP sending, sender rotation, CSV import, personalization, analytics — all free. AI studio & deliverability tools included.',
};

const freeFeatures = [
  { icon: Mail, title: 'Any SMTP Provider', desc: 'Gmail, Outlook, Hostinger, Zoho, or custom. 10 provider presets auto-fill host and port. No shared IP pools.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: RefreshCw, title: 'Sender Rotation', desc: 'Add multiple accounts, split volume by percentage. Weighted random distribution keeps patterns natural and protects reputation.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: UploadCloud, title: 'CSV Import & Auto-Mapping', desc: 'Drop a CSV file — emails, names, and companies are auto-detected. Built-in disposable email filtering and role-address warnings.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Edit3, title: 'Deep Personalization', desc: 'Use {{name}}, {{first_name}}, {{company}}, and {{email}} in subject and body. Preview how each recipient sees your email.', color: 'text-pink-600', bg: 'bg-pink-50' },
  { icon: BarChart3, title: 'Campaign Analytics', desc: 'Sent counts, delivery rates, status breakdowns. Donut and bar charts. Know exactly what is happening across all campaigns.', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: ShieldCheck, title: '100% Local Privacy', desc: 'Contacts, emails, and credentials never leave your computer. Emails go directly from your SMTP to the recipient.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Clock, title: 'Scheduling & Delays', desc: 'Set delays between emails from 10 seconds to 10 minutes. Define daily sending windows. Pause and resume anytime.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Copy, title: 'Duplicate & Templates', desc: 'Clone campaigns with one click. Save your best emails as templates. Build your workflow once and reuse forever.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Moon, title: 'Clean Modern UI', desc: 'Light, crisp interface designed for effortless campaign launches and high readability.', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: Monitor, title: 'Native Desktop App', desc: 'Runs on your PC, not in a browser tab. Lives in the system tray. Minimize and forget — it keeps working in the background.', color: 'text-blue-600', bg: 'bg-blue-50' },
];

const studioFeatures = [
  { icon: Sparkles, title: 'AI Lead Sanitizer & Icebreakers', desc: 'Removes dirty titles (Dr., MBA, LLC), extracts first names, and writes 1-sentence opening hooks.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Zap, title: 'Spam-Proof Spintax Studio', desc: 'Real-time 300+ spam word scanner with 1-click De-Spamify and auto-generated {Hey|Hi} variations.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Monitor, title: '1-to-1 Dynamic Pitch Pages', desc: 'Generate unique /p/slug micro-landing pages per prospect with Loom embeds & Cal.com booking.', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: ShieldCheck, title: 'DNS Deliverability Shield', desc: 'Inspect live SPF, DKIM, DMARC, and MX records with copy-paste Cloudflare & GoDaddy fixes.', color: 'text-amber-600', bg: 'bg-amber-50' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      {/* Header */}
      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          Everything Included
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Everything Ships with the Platform
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base">
          No feature gates. No upgrade traps. Competitors charge $79–149/month for less than this.
        </p>
      </section>

      {/* Studio Features Section */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-sm tracking-wide uppercase">
            <Sparkles className="w-4 h-4" /> The 4-Pillar AI Studio (Web &amp; Cloud)
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {studioFeatures.map((f, i) => (
              <div key={i} className="bg-slate-50/70 p-6 rounded-3xl border border-slate-200 space-y-3 hover:bg-white hover:shadow-lg transition-all">
                <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center ${f.color} font-bold`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Desktop Engine Features */}
      <section className="py-16 px-4 sm:px-6 border-t border-slate-200 bg-slate-50/70">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm tracking-wide uppercase">
            <Check className="w-4 h-4 text-emerald-600" /> Included Free in the Desktop App (.EXE)
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {freeFeatures.map((f, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3 shadow-xs hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center ${f.color} font-bold`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
