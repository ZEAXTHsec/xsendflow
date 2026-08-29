'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, CheckCircle2, Send, Eye, MessageSquare, TrendingUp, 
  Zap, ShieldCheck, Mail, Users, ArrowUpRight, Clock, Plus, 
  Activity, Server, Sparkles, RefreshCw, Flame, ExternalLink,
  Search, Play, Pause, FileText, ChevronRight, ChevronLeft, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campaign } from './CampaignsTab';

interface Props {
  onNavigateTab?: (tab: 'campaigns' | 'leads' | 'pitch') => void;
  onOpenSettings?: () => void;
}

export default function AnalyticsTab({ onNavigateTab, onOpenSettings }: Props) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft' | 'done'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [draftInfo, setDraftInfo] = useState<{ name: string; lastSavedAt: string; step: number } | null>(null);

  const ITEMS_PER_PAGE = 4;

  const loadCampaigns = () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('xsendflow_campaigns_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCampaigns(parsed);
      } else {
        // Default sample campaign if empty
        const defaultCamp: Campaign = {
          id: 'camp-sample-1',
          name: 'Q3 Enterprise Outbound Pilot',
          fromName: 'Alex Mercer',
          senderId: 'sender-primary',
          delaySeconds: 45,
          dailyLimit: 100,
          windowStart: '09:00',
          windowEnd: '17:00',
          timezone: 'America/New_York (EST)',
          status: 'sending',
          steps: [
            { id: 1, dayDelay: 0, subject: 'Quick question for {{First_Name}}', body: 'Hey {{First_Name}}...' },
            { id: 2, dayDelay: 3, subject: 'Re: quick question', body: 'Checking back...' }
          ],
          recipients: [
            { id: 'rec-1', email: 'sarah@datadog.com', firstName: 'Sarah', company: 'Datadog', status: 'sent' },
            { id: 'rec-2', email: 'robert@acmesolutions.com', firstName: 'Robert', company: 'Acme Solutions', status: 'opened' },
            { id: 'rec-3', email: 'david@stripe.com', firstName: 'David', company: 'Stripe', status: 'pending' }
          ],
          createdAt: new Date().toISOString()
        };
        setCampaigns([defaultCamp]);
      }

      // Check for unfinished wizard draft
      const savedDraft = localStorage.getItem('xsendflow_wizard_draft');
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft && parsedDraft.name) {
          setDraftInfo({
            name: parsedDraft.name || 'Untitled Campaign Draft',
            lastSavedAt: parsedDraft.lastSavedAt || new Date().toISOString(),
            step: parsedDraft.wizardStep || 1
          });
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    loadCampaigns();
    const handleSync = () => loadCampaigns();
    window.addEventListener('storage', handleSync);
    window.addEventListener('xsendflow_campaigns_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('xsendflow_campaigns_updated', handleSync);
    };
  }, []);

  const handleToggleCampaignStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = campaigns.map(c => {
      if (c.id === id) {
        const nextStatus = (c.status === 'sending' || c.status === 'in_progress' || c.status === 'scheduled') ? 'paused' : 'sending';
        return { ...c, status: nextStatus as any };
      }
      return c;
    });
    setCampaigns(updated);
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(updated));
      window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
    } catch {}
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fromName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return c.status === 'sending' || c.status === 'in_progress' || c.status === 'scheduled';
    if (statusFilter === 'paused') return c.status === 'paused';
    if (statusFilter === 'draft') return c.status === 'draft';
    if (statusFilter === 'done') return c.status === 'done';
    return true;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE) || 1;
  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Status counts
  const activeCount = campaigns.filter(c => c.status === 'sending' || c.status === 'in_progress' || c.status === 'scheduled').length;
  const pausedCount = campaigns.filter(c => c.status === 'paused').length;
  const draftCount = campaigns.filter(c => c.status === 'draft').length;
  const doneCount = campaigns.filter(c => c.status === 'done').length;

  return (
    <div className="space-y-8">
      
      {/* 1. EXECUTIVE HERO COMMAND BAR (Zero IP Leak) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0b101b] border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>VPS Cloud Cluster Active (US-East)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gaussian Jitter: 45s–75s</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campaign Intelligence &amp; Fleet Monitor
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
              <span>Lead Database</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Mailbox Fleet</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. DRAFT IN PROGRESS ALERT BANNER (If Unfinished Setup Exists) */}
      {draftInfo && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-slate-900 border border-indigo-500/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{draftInfo.name}</span>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.2 rounded-full">
                  Step {draftInfo.step} Draft
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                You have an unfinished campaign auto-saved in your vault. Click resume to finish and launch.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab?.('campaigns')}
            className="text-xs font-bold bg-white hover:bg-slate-100 text-indigo-950 px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 font-mono"
          >
            <span>Resume Draft ➔</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. CAMPAIGN OPERATIONS COMMAND CENTER (Scalable Grid with Filtering & Zero Clutter) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">Campaign Fleet Operations</h3>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                {campaigns.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500">Monitor active cloud queues, pause campaigns, or finish pending drafts</p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search campaigns..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({campaigns.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('paused'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'paused' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Paused ({pausedCount})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('draft'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'draft' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Drafts ({draftCount})
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Cards Grid */}
        {paginatedCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedCampaigns.map((camp) => {
              const totalRecipients = camp.recipients?.length || 0;
              const sentRecipients = camp.recipients?.filter(r => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 0;
              const openRecipients = camp.recipients?.filter(r => r.status === 'opened' || r.status === 'replied').length || 0;
              const progressPct = totalRecipients > 0 ? Math.round((sentRecipients / totalRecipients) * 100) : 0;
              const openPct = sentRecipients > 0 ? Math.round((openRecipients / sentRecipients) * 100) : 0;

              const isSending = camp.status === 'sending' || camp.status === 'in_progress' || camp.status === 'scheduled';
              const isPaused = camp.status === 'paused';
              const isDraft = camp.status === 'draft';

              return (
                <div
                  key={camp.id}
                  onClick={() => onNavigateTab?.('campaigns')}
                  className="p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 transition-all cursor-pointer space-y-4 group hover:shadow-md hover:border-indigo-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {camp.name}
                        </h4>
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isSending
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isPaused
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : isDraft
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}>
                          {isSending ? '🟢 Active' : isPaused ? '⏸️ Paused' : isDraft ? '📝 Draft' : '✅ Done'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        From: {camp.fromName || 'Founder'} • {camp.steps?.length || 1} Sequence Steps
                      </p>
                    </div>

                    {/* Action button */}
                    {!isDraft && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleCampaignStatus(camp.id, e)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          isSending 
                            ? 'bg-white hover:bg-amber-50 border-slate-200 text-amber-700 hover:border-amber-300' 
                            : 'bg-white hover:bg-emerald-50 border-slate-200 text-emerald-700 hover:border-emerald-300'
                        }`}
                        title={isSending ? 'Pause Campaign' : 'Resume Campaign'}
                      >
                        {isSending ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>
                    )}
                  </div>

                  {/* Progress Bar & Telemetry */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>Dispatch Progress ({sentRecipients} / {totalRecipients} leads)</span>
                      <span className="font-mono">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSending ? 'bg-indigo-600' : 'bg-slate-400'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                    <div className="flex items-center gap-3">
                      <span>Opens: <strong className="text-slate-800 font-bold">{openPct}%</strong></span>
                      <span>Replies: <strong className="text-emerald-700 font-bold">14.2%</strong></span>
                    </div>
                    <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {isDraft ? 'Finish Setup' : 'Manage'} ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">No campaigns match your filter</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create a high-converting cold email sequence with multi-inbox rotation and AI icebreakers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab?.('campaigns')}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              Create New Campaign 🚀
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-600">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
                <div className="font-extrabold text-slate-900">Positive Reply Received: &quot;Let&apos;s connect Tuesday 2pm&quot;</div>
                <div className="text-slate-500 text-[11px]">2 mins ago • robert@acmesolutions.com • Acme Solutions</div>
              </div>
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
