import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | XSendFlow',
  description: 'Terms of Service for XSendFlow Desktop & Studio.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Legal Terms
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-sm">
          Last updated: August 2026
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Permitted Use</h2>
          <p>
            XSendFlow provides software tools for personalized B2B outreach and deliverability management. You agree to adhere to all applicable international anti-spam regulations (CAN-SPAM, GDPR, CASL) and to maintain valid opt-out mechanisms.
          </p>

          <h2 className="text-lg font-bold text-slate-900">2. Software License</h2>
          <p>
            The XSendFlow Desktop application is provided for free personal and commercial use. You may connect your own SMTP accounts to send outreach in accordance with your email host terms.
          </p>

          <h2 className="text-lg font-bold text-slate-900">3. Disclaimer of Warranty</h2>
          <p>
            The software and AI services are provided &quot;as is&quot; without warranty of any kind, express or implied. We do not guarantee inbox delivery rates for misconfigured domain records or unauthenticated SMTP servers.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
