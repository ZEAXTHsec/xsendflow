'use client';

import React from 'react';
import { BarChart3, CheckCircle2, Send, Eye, MessageSquare, TrendingUp } from 'lucide-react';

export default function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            <span>Campaign Intelligence &amp; Inboxing Analytics</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Delivery Health &amp; Inboxing Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Real-time analytics across all your active campaigns, inbox delivery rates, and prospect engagement metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Total Sent</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tnum">1,420</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18% this week
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Delivery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono tnum">99.4%</div>
          <div className="text-[11px] text-slate-500">Zero spam filter penalties</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Open Rate</span>
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-600 font-mono tnum">64.2%</div>
          <div className="text-[11px] text-slate-500">Industry avg: 22%</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
            <span>Reply Rate</span>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600 font-mono tnum">14.8%</div>
          <div className="text-[11px] text-emerald-600 font-semibold">1-to-1 pitch page boost</div>
        </div>
      </div>

      {/* Deliverability Factors Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Inboxing Safety Health Check</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800">Domain Reputation</span>
              <span className="text-emerald-700 font-bold font-mono">100 / 100 (Clean)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800">Spintax Variance Factor</span>
              <span className="text-emerald-700 font-bold font-mono">98.5% Unique Hashes</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800">Spam Trigger Keyword Density</span>
              <span className="text-emerald-700 font-bold font-mono">0.0% (Clean)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800">DNS SPF / DKIM / DMARC Alignment</span>
              <span className="text-emerald-700 font-bold font-mono">PASS (100% Strict)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Prospect Engagement Timeline</h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <div>
                <div className="font-bold text-slate-900">Prospect viewed pitch page /p/stripe-john</div>
                <div className="text-slate-500 text-[11px]">2 minutes ago • Stripe</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
              <div>
                <div className="font-bold text-slate-900">Email opened by sarah@datadog.com</div>
                <div className="text-slate-500 text-[11px]">18 minutes ago • Step 1 initial</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"></span>
              <div>
                <div className="font-bold text-slate-900">15-minute intro meeting booked via Cal.com</div>
                <div className="text-slate-500 text-[11px]">1 hour ago • Acme Solutions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
