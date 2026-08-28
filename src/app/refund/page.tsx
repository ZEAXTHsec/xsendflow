import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund Policy | XSendFlow',
  description: 'Refund Policy for XSendFlow Desktop & Studio.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Transparency
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Refund Policy
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-sm">
          Last updated: August 2026
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-lg font-bold text-slate-900">1. Free Desktop Engine &amp; Studio</h2>
          <p>
            The XSendFlow desktop sender and baseline AI studio features are completely free forever. There are no upfront setup fees or mandatory recurring costs.
          </p>

          <h2 className="text-lg font-bold text-slate-900">2. Optional Server Add-Ons</h2>
          <p>
            For optional monthly server workers ($14/mo) or tips, refunds may be requested within 7 days of payment if the cloud worker is not meeting your requirements.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
