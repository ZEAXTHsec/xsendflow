import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | XSendFlow',
  description: 'Privacy Policy for XSendFlow Desktop & AI Studio.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Data Privacy First
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-sm">
          Last updated: August 2026
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Local Processing Model</h2>
          <p>
            The XSendFlow Desktop application operates on a local-first architecture. All recipient emails, campaign logs, and SMTP configuration parameters are stored exclusively in your local storage on your machine.
          </p>

          <h2 className="text-lg font-bold text-slate-900">2. AI Deliverability Studio Services</h2>
          <p>
            When utilizing browser-based lead cleaning or Spintax generation tools, lead records are processed strictly within your browser session memory or ephemeral API requests. We do not sell, rent, or monetize your prospect lists.
          </p>

          <h2 className="text-lg font-bold text-slate-900">3. Analytics &amp; Cookies</h2>
          <p>
            We do not use intrusive cross-site tracking cookies. Basic anonymous usage telemetry may be collected strictly to improve software stability.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
