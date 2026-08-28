import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | XSendFlow',
  description: 'Common questions about XSendFlow Desktop, AI Studio, SMTP rotation, and deliverability.',
};

const faqs = [
  {
    q: 'How is the XSendFlow Desktop app completely free?',
    a: 'We believe sending emails through accounts you already pay for (Google Workspace, Zoho, Outlook) should not cost an extra $79–149/month. The desktop app connects directly to your own SMTP servers with zero middleman markups.'
  },
  {
    q: 'Are my contacts or credentials stored in the cloud?',
    a: 'No. When using the Desktop Engine, 100% of your email lists, contact databases, and SMTP credentials remain stored locally on your own computer.'
  },
  {
    q: 'What is the AI Deliverability Studio?',
    a: 'It is a browser-based companion workspace designed to prepare campaigns for maximum inbox placement. It cleans raw dirty lead lists, scans 300+ spam keywords, auto-generates Spintax variations, generates 1-to-1 dynamic pitch pages, and audits DNS records (SPF, DKIM, DMARC).'
  },
  {
    q: 'What are Dynamic 1-to-1 Pitch Pages (/p/slug)?',
    a: 'Instead of generic PDF attachments or links, XSendFlow generates dedicated prospect micro-landing pages with company branding, your video walkthrough embed, and a direct Cal.com booking widget.'
  },
  {
    q: 'Which SMTP providers are supported?',
    a: 'All standard SMTP providers including Gmail/Google Workspace, Microsoft Outlook/365, Zoho Mail, Hostinger, Amazon SES, SendGrid, Mailgun, and custom private VPS mail servers.'
  }
];

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Got Questions?
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base">
          Everything you need to know about desktop sending, local privacy, and the AI Studio.
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-all">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
