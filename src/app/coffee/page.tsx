'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Heart, Coffee, CheckCircle2 } from 'lucide-react';

export default function CoffeePage() {
  const [amount, setAmount] = useState('5');
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [tipped, setTipped] = useState(false);

  const handleTip = () => {
    setTipped(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-amber-500 selection:text-black">
      <Header />

      <section className="pt-24 pb-16 px-4 sm:px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          <Coffee className="w-3.5 h-3.5 text-amber-600" /> Support Indie Development
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Buy Us a Coffee ☕
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-base leading-relaxed">
          XSendFlow is built independently to keep cold outreach tools accessible and free for founders &amp; builders. Tips help cover domain maintenance, AI infrastructure, and updates!
        </p>
      </section>

      <section className="py-12 px-4 sm:px-6 flex-1">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Tip Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {['3', '5', '10', '25'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => { setAmount(amt); setCustomAmount(''); }}
                  className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                    amount === amt && !customAmount
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <input
              type="number"
              placeholder="Or custom amount ($)"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(e.target.value); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 mt-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message (Optional)</label>
            <textarea
              rows={3}
              placeholder="Say something nice..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="button"
            onClick={handleTip}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95 glow-tag"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Tip ${customAmount || amount} Coffee</span>
          </button>

          {tipped && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thank you so much for supporting XSendFlow! ❤️</span>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
