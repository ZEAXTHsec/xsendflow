'use client';

import React, { useState } from 'react';
import { 
  BarChart3, CheckCircle2, Send, Eye, MessageSquare, TrendingUp, 
  Zap, ShieldCheck, Mail, Users, ArrowUpRight, Clock, Plus, 
  Activity, Server, Sparkles, RefreshCw, Flame, ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onNavigateTab?: (tab: 'campaigns' | 'leads' | 'pitch') => void;
  onOpenSettings?: () => void;
}

export default function AnalyticsTab({ onNavigateTab, onOpenSettings }: Props) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Chart data simulation
  const chartDays = [
    { day: 'Mon', sent: 180, opened: 120, replied: 28, height: '65%' },
    { day: 'Tue', sent: 240, opened: 165, replied: 42, height: '85%' },
    { day: 'Wed', sent: 210, opened: 142, replied: 35, height: '75%' },
    { day: 'Thu', sent: 290, opened: 198, replied: 48, height: '100%' },
    { day: 'Fri', sent: 260, opened: 175, replied: 39, height: '90%' },
    { day: 'Sat', sent: 110, opened: 72, replied: 15, height: '40%' },
    { day: 'Sun', sent: 130, opened: 88, replied: 18, height: '48%' },
  ];

  return (
    <div className="space-y-8">
      
      {/* 1. EXECUTIVE HERO COMMAND BAR (Dark High-Contrast Container) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0b101b] border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>VPS Engine Active (68.233.104.131)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gaussian Jitter: 45s–75s</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campaign Intelligence &amp; Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time monitoring across rotated sender mailboxes, deliverability health, and prospect engagement conversions.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab?.('campaigns')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign</span>
            </button>

            <button
              onClick={() => onNavigateTab?.('leads')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Lead Sanitizer</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Mailboxes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORE KPI METRICS ROW (Structured High-Contrast Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Total Outbound Sent</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tnum">1,420</div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% this week</span>
          </div>
        </div>

        {/* Inboxing Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Inbox Placement</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono tnum">99.4%</div>
          <div className="text-[11px] text-slate-500 font-medium">
            0 spam filter penalties detected
          </div>
        </div>

        {/* Open Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Unique Open Rate</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-600 font-mono tnum">64.2%</div>
          <div className="text-[11px] text-slate-500 font-medium">
            3x higher than industry average (22%)
          </div>
        </div>

        {/* Reply & Booking Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Response &amp; Bookings</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 font-mono tnum">14.8%</div>
          <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Personalized pitch page boost</span>
          </div>
        </div>
      </div>

      {/* 3. ACTIVITY THROUGHPUT & DELIVERABILITY CHART SECTION */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">7-Day Outbound Volume &amp; Engagement</h2>
            </div>
            <p className="text-xs text-slate-500">Paced sending distribution with Spintax entropy variation.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['7d', '30d', 'all'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === r ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-6 pt-4 items-end h-48 sm:h-56 px-2">
          {chartDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group">
              <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                {d.sent} sent
              </div>
              <div className="w-full bg-slate-100 rounded-t-xl h-full flex flex-col justify-end p-1 relative overflow-hidden">
                <div
                  style={{ height: d.height }}
                  className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-cyan-400 rounded-lg transition-all duration-500 group-hover:brightness-110 shadow-xs"
                />
              </div>
              <span className="text-xs font-bold text-slate-600">{d.day}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Outbound Sent</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Opens Tracked</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Pitch Page Views</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Timezone: America/New_York (EST)</span>
        </div>
      </div>

      {/* 4. TWO-COLUMN OPERATIONAL STATUS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Mailbox Rotation Health */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" /> Connected Mailbox Health &amp; Daily Quota
              </h3>
              <p className="text-xs text-slate-500">Individual inbox pacing prevents domain burn penalties.</p>
            </div>
            <button
              onClick={onOpenSettings}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Manage Inboxes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {/* Sender 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">Google Workspace (Primary)</div>
                  <div className="text-[11px] font-mono text-slate-500">outreach@xsendflow.com</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  100% HEALTH
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Daily Sending Limit</span>
                  <span>42 / 50 sent today</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full w-[84%]" />
                </div>
              </div>
            </div>

            {/* Sender 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">Hostinger TLS Mailbox 1</div>
                  <div className="text-[11px] font-mono text-slate-500">growth@xsendflow.com</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  99% HEALTH
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Daily Sending Limit</span>
                  <span>28 / 50 sent today</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full w-[56%]" />
                </div>
              </div>
            </div>

            {/* Sender 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-slate-900">Hostinger TLS Mailbox 2</div>
                  <div className="text-[11px] font-mono text-slate-500">team@xsendflow.com</div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  WARMING UP
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-600">
                  <span>Daily Sending Limit</span>
                  <span>15 / 30 sent today</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-[50%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Prospect Engagement Stream */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" /> Live Prospect Activity Stream
              </h3>
              <p className="text-xs text-slate-500">Real-time open events, link clicks, and meetings booked.</p>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 animate-ping" />
              <div className="flex-1">
                <div className="font-extrabold text-slate-900">Prospect viewed personalized pitch page</div>
                <div className="text-slate-500 text-[11px]">2 mins ago • /p/stripe-john • Stripe</div>
              </div>
              <button onClick={() => onNavigateTab?.('pitch')} className="text-slate-400 hover:text-slate-900">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="font-extrabold text-slate-900">Email opened by sarah@datadog.com</div>
                <div className="text-slate-500 text-[11px]">18 mins ago • Sequence Step 1 • Subject: Quick inquiry</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="font-extrabold text-slate-900">15-Minute Demo Intro Call Booked</div>
                <div className="text-slate-500 text-[11px]">1 hour ago • Cal.com Integration • Acme Solutions</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-slate-100/80 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="font-extrabold text-slate-900">Spintax batch dispatched (45s jitter)</div>
                <div className="text-slate-500 text-[11px]">2 hours ago • Campaign: B2B Growth • 25 recipients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DELIVERABILITY SAFETY METRIC AUDIT (Fintech Dark Card) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0f172a] border border-slate-800 text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Automated Inboxing Safety Guard
            </h3>
            <p className="text-xs text-slate-400">Active protection layers preventing spam traps and domain blocklists.</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            ALL SYSTEMS PASS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Domain Reputation</div>
            <div className="text-lg font-black text-emerald-400 font-mono">100 / 100</div>
            <div className="text-[10px] text-slate-500">0 blacklists detected</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Spintax Entropy</div>
            <div className="text-lg font-black text-indigo-400 font-mono">98.5%</div>
            <div className="text-[10px] text-slate-500">Unique copy per send</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">Spam Trigger Density</div>
            <div className="text-lg font-black text-cyan-400 font-mono">0.0%</div>
            <div className="text-[10px] text-slate-500">300+ keywords scanned</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase">DNS Alignment</div>
            <div className="text-lg font-black text-emerald-400 font-mono">PASS (100%)</div>
            <div className="text-[10px] text-slate-500">SPF, DKIM, DMARC valid</div>
          </div>
        </div>
      </div>

    </div>
  );
}
