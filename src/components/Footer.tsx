import React from 'react';
import Link from 'next/link';
import { Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80 py-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand Column */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
              X
            </div>
            <span className="font-bold text-sm text-slate-900 tracking-tight">XSendFlow</span>
          </div>
          <p className="text-slate-600 max-w-sm leading-relaxed text-[11px]">
            The zero-cost cold email acceleration suite &amp; AI deliverability studio. Stop paying $79–149/mo for simple sending tools.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Link href="/coffee" className="text-amber-600 hover:text-amber-700 flex items-center gap-1 text-[11px] transition-colors font-medium">
              <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Support Development</span>
            </Link>
          </div>
        </div>

        {/* Column 1: Product */}
        <div className="space-y-2">
          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">Product</span>
          <ul className="space-y-1.5 text-[11px]">
            <li><Link href="/features" className="hover:text-slate-900 transition-colors">Features</Link></li>
            <li><Link href="/how-it-works" className="hover:text-slate-900 transition-colors">How it Works</Link></li>
            <li><Link href="/studio" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">AI Studio <Sparkles className="w-2.5 h-2.5 text-purple-600" /></Link></li>
            <li><Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link></li>
          </ul>
        </div>

        {/* Column 2: Compare & Intel */}
        <div className="space-y-2">
          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">Compare</span>
          <ul className="space-y-1.5 text-[11px]">
            <li><Link href="/vs" className="hover:text-slate-900 transition-colors">vs Mailshake</Link></li>
            <li><Link href="/vs" className="hover:text-slate-900 transition-colors">vs Instantly</Link></li>
            <li><Link href="/vs" className="hover:text-slate-900 transition-colors">vs Lemlist</Link></li>
            <li><Link href="/changelog" className="hover:text-slate-900 transition-colors">Changelog &amp; Updates</Link></li>
          </ul>
        </div>

        {/* Column 3: Legal & Support */}
        <div className="space-y-2">
          <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">Support &amp; Legal</span>
          <ul className="space-y-1.5 text-[11px]">
            <li><Link href="/faq" className="hover:text-slate-900 transition-colors">FAQ</Link></li>
            <li><Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link></li>
            <li><Link href="/refund" className="hover:text-slate-900 transition-colors">Refund Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <span>© {new Date().getFullYear()} XSendFlow. Built for privacy, speed, and 100% inboxing.</span>
        <span>Your data never leaves your computer.</span>
      </div>
    </footer>
  );
}
