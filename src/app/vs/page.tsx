import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Sparkles, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'XSendFlow vs Competitors — Transparent Comparison',
  description: 'Compare XSendFlow against Mailshake, Instantly, and Lemlist.',
};

export default function VsPage() {
  const comparison = [
    { feature: 'Monthly Studio & Deliverability Cost', xsend: '$0 / Free in Browser', comp1: '$79/mo (Mailshake)', comp2: '$49/mo (Instantly)', comp3: '$149/mo (Lemlist)' },
    { feature: 'Daily Email Volume Cap', xsend: 'Unlimited (Your SMTP limit)', comp1: '1,500/day limit', comp2: 'Account capped', comp3: '500/day limit' },
    { feature: '100% In-Browser Privacy', xsend: 'Yes (Session & Local)', comp1: 'No (Cloud stored)', comp2: 'No (Cloud stored)', comp3: 'No (Cloud stored)' },
    { feature: 'AI Lead Sanitizer & Icebreakers', xsend: 'Included Free in Studio', comp1: 'Extra $$ add-on', comp2: 'Limited credits', comp3: 'Tier upgrade required' },
    { feature: '1-to-1 Dynamic Pitch Pages', xsend: 'Included (/p/slug)', comp1: 'Not available', comp2: 'Not available', comp3: 'Basic landing page ($149)' },
    { feature: 'Real-Time Spam Word Scanner', xsend: 'Included Free', comp1: 'Basic', comp2: 'Basic', comp3: 'Basic' },
    { feature: 'Live DNS Deliverability Shield', xsend: 'Included Free', comp1: 'Separate tool', comp2: 'Basic lookup', comp3: 'Separate tool' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          Side-by-Side Breakdown
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          How XSendFlow Stacks Up
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base">
          Stop paying the monthly &quot;SaaS Tax&quot; for tools that just send emails through the mailboxes you already own.
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="p-4">Feature</th>
                  <th className="p-4 text-indigo-700 bg-indigo-50 rounded-t-xl font-extrabold">XSendFlow</th>
                  <th className="p-4">Mailshake</th>
                  <th className="p-4">Instantly</th>
                  <th className="p-4">Lemlist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparison.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{row.feature}</td>
                    <td className="p-4 font-bold text-indigo-700 bg-indigo-50/40">{row.xsend}</td>
                    <td className="p-4 text-slate-500">{row.comp1}</td>
                    <td className="p-4 text-slate-500">{row.comp2}</td>
                    <td className="p-4 text-slate-500">{row.comp3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/studio"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 active:scale-95 glow-tag"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>Launch AI Studio (Free)</span>
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
