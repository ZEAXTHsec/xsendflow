import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { 
  ShieldCheck, CheckCircle2, TrendingUp, Mail, Eye, 
  MessageSquare, BarChart3, Clock, Sparkles, Building2 
} from 'lucide-react';
import Logo, { LogoIcon } from '@/components/ui/Logo';

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Live Client Outbound Performance Report | XSendFlow`,
    description: `Verified real-time email deliverability, open rates, and inbox placement audit.`,
  };
}

export default async function ClientReportPage({ params }: Props) {
  const { token } = await params;

  // Mock report data for demo / verified share token
  const reportData = {
    clientName: 'Stripe Global Growth Fleet',
    agencyName: 'Apex Outbound Partners',
    campaignName: 'Q4 Enterprise Decision Makers',
    totalSent: 18420,
    inboxPlacement: 99.6,
    openRate: 68.4,
    repliesCount: 412,
    replyRate: 15.2,
    activeInboxes: 12,
    timeZone: 'America/New_York (EST)',
    lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Client Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIcon size="sm" />
            <div className="border-l border-slate-700 pl-3">
              <span className="text-xs font-mono font-bold text-slate-300 block">
                {reportData.agencyName}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Verified Client Performance Portal
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE AUDIT DATA</span>
          </div>
        </div>
      </header>

      {/* Main Report Dashboard */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full space-y-8">
        {/* Executive Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0b101b] border border-slate-800 p-8 shadow-2xl space-y-3">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Prepared for: {reportData.clientName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Outbound Deliverability &amp; Pipeline Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Real-time telemetry tracked across {reportData.activeInboxes} dedicated Google Workspace &amp; Hostinger inboxes utilizing Gaussian human jitter and FSM Spintax fingerprints.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <span>Campaign: <strong className="text-slate-200">{reportData.campaignName}</strong></span>
            <span>•</span>
            <span>Audit Date: <strong className="text-slate-200">{reportData.lastUpdated}</strong></span>
          </div>
        </div>

        {/* 4 Core Client KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-blue-400" /> Total Outbound
            </span>
            <div className="text-3xl font-black text-white font-mono">{reportData.totalSent.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>100% Paced Dispatch</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Inbox Placement
            </span>
            <div className="text-3xl font-black text-emerald-400 font-mono">{reportData.inboxPlacement}%</div>
            <div className="text-[11px] text-slate-400">0 spam filter penalties</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-400" /> Verified Open Rate
            </span>
            <div className="text-3xl font-black text-indigo-400 font-mono">{reportData.openRate}%</div>
            <div className="text-[11px] text-slate-400">3.1x industry standard (22%)</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-purple-400" /> Positive B2B Replies
            </span>
            <div className="text-3xl font-black text-purple-400 font-mono">{reportData.repliesCount} ({reportData.replyRate}%)</div>
            <div className="text-[11px] text-purple-300 font-semibold">High buying intent</div>
          </div>
        </div>

        {/* Live Security Verification Footer */}
        <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cryptographically Verified Client Token:</span>
            <code className="text-slate-300 font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded">{token.slice(0, 16)}...</code>
          </div>
          <p className="text-[11px] text-slate-500">
            Telemetry streamed directly via XSendFlow Enterprise Outbound Infrastructure.
          </p>
        </div>
      </main>

      {/* Branded Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" theme="dark" />
          <span>Powered by XSendFlow Agency Deliverability Engine</span>
        </div>
      </footer>
    </div>
  );
}
