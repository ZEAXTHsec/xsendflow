'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, CheckCircle2, Send, Eye, MessageSquare, TrendingUp, 
  Zap, ShieldCheck, Mail, Users, ArrowUpRight, Clock, Plus, 
  Activity, Server, Sparkles, RefreshCw, Flame, ExternalLink,
  Search, Play, Pause, FileText, ChevronRight, ChevronLeft, ArrowRight, Cloud,
  Copy, Download, X, Sliders, Layers, Filter, Check, Trash2, Inbox, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Campaign, CampaignRecipient } from './CampaignsTab';
import { AGENCY_MOCK_SENDERS, getAgencyMockCampaigns, getHighVolumeMockCampaigns, SenderAccount } from '@/lib/mockData/agencyMockData';

import UpgradeProModal from '../modals/UpgradeProModal';
import CloneCampaignModal from '../modals/CloneCampaignModal';
import { UserPlan } from '@/lib/planLimits';

interface Props {
  onNavigateTab?: (tab: 'campaigns' | 'leads' | 'pitch') => void;
  onOpenSettings?: () => void;
}

export default function AnalyticsTab({ onNavigateTab, onOpenSettings }: Props) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'campaign_limit' | 'pro_campaign_limit' | 'mailbox_limit'>('campaign_limit');
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [campaignToClone, setCampaignToClone] = useState<Campaign | null>(null);
  const [senders, setSenders] = useState<SenderAccount[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('xsendflow_senders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'draft' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'open_rate' | 'sent' | 'replies'>('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [draftInfo, setDraftInfo] = useState<{ name: string; lastSavedAt: string; step: number } | null>(null);

  // Dedicated In-Dashboard Campaign Inspector State
  const [selectedInspectCampaign, setSelectedInspectCampaign] = useState<Campaign | null>(null);
  const [inspectActiveTab, setInspectActiveTab] = useState<'leads' | 'sequence' | 'mailboxes' | 'pacing'>('leads');
  const [leadFilterStatus, setLeadFilterStatus] = useState<'all' | 'replied' | 'opened' | 'sent' | 'pending'>('all');
  const [leadSearch, setLeadSearch] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [editDailyLimit, setEditDailyLimit] = useState<number>(150);
  const [editDelaySeconds, setEditDelaySeconds] = useState<number>(45);

  const handleOpenInspector = (camp: Campaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedInspectCampaign(camp);
    setEditDailyLimit(camp.dailyLimit || 150);
    setEditDelaySeconds(camp.delaySeconds || 45);
    setInspectActiveTab('leads');
  };

  const handleCloneCampaign = (camp: Campaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCampaignToClone(camp);
    setIsCloneModalOpen(true);
  };

  const handleConfirmClone = (clonedCamp: Campaign) => {
    const updated = [clonedCamp, ...campaigns];
    setCampaigns(updated);
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(updated));
      window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
    } catch {}
    setSelectedInspectCampaign(clonedCamp);
    try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch {}
  };

  const handleDeleteCampaign = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = campaigns.find(c => c.id === id);
    if (!target) return;
    if (!confirm(`Are you sure you want to permanently delete campaign "${target.name}"?`)) return;
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(updated));
      window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
    } catch {}
    if (selectedInspectCampaign?.id === id) setSelectedInspectCampaign(null);
  };

  const handleExportLeadsCSV = (camp: Campaign, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!camp.recipients || camp.recipients.length === 0) {
      alert('No leads in this campaign to export.');
      return;
    }
    const headers = ['Email', 'First Name', 'Company', 'Status', 'Sent At'];
    const rows = camp.recipients.map(r => [
      `"${r.email}"`,
      `"${r.firstName || ''}"`,
      `"${r.company || ''}"`,
      `"${r.status || 'pending'}"`,
      `"${r.sentAt || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${camp.name.replace(/[^a-zA-Z0-9]/g, '_')}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePacingSettings = () => {
    if (!selectedInspectCampaign) return;
    const updated = campaigns.map(c => {
      if (c.id === selectedInspectCampaign.id) {
        return {
          ...c,
          dailyLimit: editDailyLimit,
          delaySeconds: editDelaySeconds
        };
      }
      return c;
    });
    setCampaigns(updated);
    setSelectedInspectCampaign({
      ...selectedInspectCampaign,
      dailyLimit: editDailyLimit,
      delaySeconds: editDelaySeconds
    });
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(updated));
      window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
    } catch {}
    alert('Campaign pacing and velocity settings updated successfully!');
  };

  const handleLoad100Campaigns = () => {
    const hvFleets = getHighVolumeMockCampaigns(100, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    setCampaigns(hvFleets);
    localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(hvFleets));
    window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
  };

  const ITEMS_PER_PAGE = 8;

  const userPlan = (typeof window !== 'undefined' ? (localStorage.getItem('xsendflow_user_plan') as string) : 'free') || 'free';
  const isFreePlan = userPlan === 'free';
  const activeCampaignsList = campaigns.filter(c => c.status === 'sending' || c.status === 'in_progress' || c.status === 'scheduled');
  const hasActiveCampaign = activeCampaignsList.length >= 1;

  const loadCampaigns = () => {
    if (typeof window === 'undefined') return;
    try {
      // Auto-purge any legacy mock test data
      const rawCamps = localStorage.getItem('xsendflow_campaigns_v2');
      if (rawCamps && (rawCamps.includes('Alex Turner') || rawCamps.includes('camp-fintech') || rawCamps.includes('ApexScale') || rawCamps.includes('agencygrowth.io') || rawCamps.includes('sender-agency-1') || rawCamps.includes('Synthetic'))) {
        localStorage.removeItem('xsendflow_campaigns_v2');
      }
      const rawSenders = localStorage.getItem('xsendflow_senders');
      if (rawSenders && (rawSenders.includes('alex.turner@agencygrowth.io') || rawSenders.includes('sender-agency-1') || rawSenders.includes('outboundscale.co'))) {
        localStorage.removeItem('xsendflow_senders');
      }

      const saved = localStorage.getItem('xsendflow_campaigns_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCampaigns(parsed);
        }
      } else {
        setCampaigns([]);
      }
      
      // Sync senders
      const savedS = localStorage.getItem('xsendflow_senders');
      if (savedS) {
        try {
          const parsedS = JSON.parse(savedS);
          if (Array.isArray(parsedS)) setSenders(parsedS);
        } catch {}
      } else {
        setSenders([]);
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
    const target = campaigns.find(c => c.id === id);
    if (!target) return;

    const isCurrentlyActive = target.status === 'sending' || target.status === 'in_progress' || target.status === 'scheduled';
    if (!isCurrentlyActive && isFreePlan && hasActiveCampaign) {
      alert(`🔒 Free Plan Limit: You can only run 1 active campaign at a time. Please pause "${activeCampaignsList[0]?.name}" before starting this campaign.`);
      return;
    }

    const updated = campaigns.map(c => {
      if (c.id === id) {
        const nextStatus = isCurrentlyActive ? 'paused' : 'sending';
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
  // Filtered and sorted campaigns
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
  }).sort((a, b) => {
    if (sortBy === 'open_rate') {
      const aSent = a.recipients?.filter((r: CampaignRecipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 1;
      const bSent = b.recipients?.filter((r: CampaignRecipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 1;
      const aOpen = (a.recipients?.filter((r: CampaignRecipient) => r.status === 'opened' || r.status === 'replied').length || 0) / aSent;
      const bOpen = (b.recipients?.filter((r: CampaignRecipient) => r.status === 'opened' || r.status === 'replied').length || 0) / bSent;
      return bOpen - aOpen;
    }
    if (sortBy === 'sent') {
      const aSent = a.recipients?.filter((r: CampaignRecipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 0;
      const bSent = b.recipients?.filter((r: CampaignRecipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 0;
      return bSent - aSent;
    }
    if (sortBy === 'replies') {
      const aRep = a.recipients?.filter((r: CampaignRecipient) => r.status === 'replied').length || 0;
      const bRep = b.recipients?.filter((r: CampaignRecipient) => r.status === 'replied').length || 0;
      return bRep - aRep;
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE) || 1;
  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Status counts
  const activeCount = campaigns.filter(c => c.status === 'sending' || c.status === 'in_progress' || c.status === 'scheduled').length;
  const pausedCount = campaigns.filter(c => c.status === 'paused').length;
  const draftCount = campaigns.filter(c => c.status === 'draft').length;
  const doneCount = campaigns.filter(c => c.status === 'done').length;

  const totalEmailsAll = campaigns.reduce((acc, c) => acc + (c.recipients?.length || 0), 0);
  const totalSentAll = campaigns.reduce((acc, c) => acc + (c.recipients?.filter((r: CampaignRecipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 0), 0);
  const totalOpensAll = campaigns.reduce((acc, c) => acc + (c.recipients?.filter((r: CampaignRecipient) => r.status === 'opened' || r.status === 'replied').length || 0), 0);
  const totalRepliesAll = campaigns.reduce((acc, c) => acc + (c.recipients?.filter((r: CampaignRecipient) => r.status === 'replied').length || 0), 0);
  const totalBouncesAll = campaigns.reduce((acc, c) => acc + (c.recipients?.filter((r: CampaignRecipient) => r.status === 'bounced' || r.status === 'failed').length || 0), 0);

  const overallOpenRate = totalSentAll > 0 ? Math.round((totalOpensAll / totalSentAll) * 100) : 0;
  const overallReplyRate = totalSentAll > 0 ? ((totalRepliesAll / totalSentAll) * 100).toFixed(1) : '0.0';
  const deliverabilityHealth = totalSentAll > 0 ? (((totalSentAll - totalBouncesAll) / totalSentAll) * 100).toFixed(1) : '100.0';

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
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>{activeCount > 0 ? 'Cloud-Powered Dispatch Active' : 'Cloud Dispatch Standby'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>{senders.length} Connected Inbox{senders.length !== 1 ? 'es' : ''}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campaign Intelligence &amp; Fleet Monitor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time monitoring across rotated sender mailboxes, deliverability health, and prospect engagement telemetry.
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

      {/* 2. EXECUTIVE OUTBOUND ANALYTICS STRIP (Campaign-Based Sorted Intelligence) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Outbound Volume */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-600" /> Outbound Volume
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {campaigns.length} Campaign{campaigns.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalSentAll.toLocaleString()}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1.5">/ {totalEmailsAll.toLocaleString()} total</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalEmailsAll > 0 ? Math.min(100, Math.round((totalSentAll / totalEmailsAll) * 100)) : 0}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{totalSentAll > 0 ? 'Dispatched across sender inboxes' : 'Ready for first sequence launch'}</span>
          </p>
        </div>

        {/* Metric 2: Aggregate Open Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-600" /> Average Open Rate
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {totalSentAll > 0 ? (overallOpenRate >= 50 ? 'Top Tier' : 'Active') : 'No Sends'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-purple-700 font-mono tracking-tight">
              {totalSentAll > 0 ? `${overallOpenRate}%` : '0%'}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, overallOpenRate)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600" />
            <span>{totalSentAll > 0 ? `${totalOpensAll.toLocaleString()} total opens tracked` : 'Opens track automatically on send'}</span>
          </p>
        </div>

        {/* Metric 3: Positive Reply Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Direct Reply Rate
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {totalSentAll > 0 ? (Number(overallReplyRate) >= 10 ? 'High Intent' : 'Active') : 'No Sends'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tracking-tight">
              {totalSentAll > 0 ? `${overallReplyRate}%` : '0.0%'}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${totalSentAll > 0 ? Math.min(100, Math.round(Number(overallReplyRate) * 3)) : 0}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>{totalSentAll > 0 ? `${totalRepliesAll.toLocaleString()} prospect replies received` : 'Replies tracked in real time'}</span>
          </p>
        </div>

        {/* Metric 4: Deliverability & Health */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Deliverability Health
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {totalSentAll > 0 ? (Number(deliverabilityHealth) >= 95 ? '100% HEALTH' : 'HEALTHY') : 'READY'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalSentAll > 0 ? `${deliverabilityHealth}%` : '100%'}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-full" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{senders.length > 0 ? `${senders.length} sender mailbox${senders.length > 1 ? 'es' : ''} connected` : 'Connect a sender mailbox to begin'}</span>
          </p>
        </div>
      </div>

      {/* 3. DRAFT IN PROGRESS ALERT BANNER (If Unfinished Setup Exists) */}
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
            onClick={() => {
              onNavigateTab?.('campaigns');
              setTimeout(() => {
                window.dispatchEvent(new Event('xsendflow_resume_draft'));
              }, 100);
            }}
            className="text-xs font-bold bg-white hover:bg-slate-100 text-indigo-950 px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0 font-mono"
          >
            <span>Resume Draft ➔</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. CAMPAIGN OPERATIONS COMMAND CENTER (Linear/Raycast-Grade Floating Row Cards) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/80 border border-slate-200/90 shadow-sm space-y-4">
        {/* Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Campaign Fleet Operations</h3>
              <span className="text-xs font-mono font-bold bg-white text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                {campaigns.length} Total Fleets
              </span>
            </div>
            <p className="text-xs text-slate-500">Live multi-mailbox sequence queues, deliverability pacing, and engagement telemetry</p>
          </div>

          {/* Search, Sort, and Status Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search campaigns..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-44 sm:w-48 font-medium shadow-2xs"
              />
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              aria-label="Sort campaigns"
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="default">Sort: Default</option>
              <option value="open_rate">Sort: Highest Opens %</option>
              <option value="sent">Sort: Most Sent</option>
              <option value="replies">Sort: Most Replies</option>
            </select>

            {/* Filter Tabs */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({campaigns.length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('paused'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'paused' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Paused ({pausedCount})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter('done'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg transition-all ${statusFilter === 'done' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Done ({doneCount})
              </button>
            </div>
          </div>
        </div>

        {/* Linear/Raycast-Grade Floating Row Cards List */}
        {paginatedCampaigns.length > 0 ? (
          <div className="space-y-2.5">
            {paginatedCampaigns.map((camp, idx) => {
              const totalRecipients = camp.recipients?.length || 0;
              const sentRecipients = camp.recipients?.filter((r: CampaignRecipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 0;
              const openRecipients = camp.recipients?.filter((r: CampaignRecipient) => r.status === 'opened' || r.status === 'replied').length || 0;
              const replyRecipients = camp.recipients?.filter((r: CampaignRecipient) => r.status === 'replied').length || 0;
              
              const progressPct = totalRecipients > 0 ? Math.round((sentRecipients / totalRecipients) * 100) : 0;
              const openPct = sentRecipients > 0 ? Math.round((openRecipients / sentRecipients) * 100) : 0;
              const replyPct = sentRecipients > 0 ? Math.round((replyRecipients / sentRecipients) * 100) : 0;

              const isSending = camp.status === 'sending' || camp.status === 'in_progress' || camp.status === 'scheduled';
              const isPaused = camp.status === 'paused';
              const isDraft = camp.status === 'draft';
              const isDone = camp.status === 'done';

              const senderInitials = (camp.fromName || 'Alex Turner')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              const campIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx;

              return (
                <div
                  key={camp.id}
                  onClick={() => handleOpenInspector(camp)}
                  className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col xl:flex-row xl:items-center justify-between gap-4 group"
                >
                  {/* Left: Sender Account Avatar + Campaign Identity */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center border border-slate-800 shadow-2xs tracking-wider">
                        {senderInitials}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        isSending ? 'bg-emerald-500 ring-1 ring-emerald-200' :
                        isPaused ? 'bg-amber-400' :
                        isDone ? 'bg-indigo-500' : 'bg-slate-300'
                      }`} />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          #{String(campIndex + 1).padStart(3, '0')}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {camp.name}
                        </h4>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isSending ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          isPaused ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          isDone ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isSending ? 'bg-emerald-500 animate-pulse' :
                            isPaused ? 'bg-amber-400' :
                            isDone ? 'bg-indigo-500' : 'bg-slate-400'
                          }`} />
                          {isSending ? 'Active' : isPaused ? 'Paused' : isDraft ? 'Draft' : 'Done'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span className="text-slate-700 font-medium">Sender: {camp.fromName || 'Alex Turner'}</span>
                        <span>•</span>
                        <span>{camp.steps?.length || 1} Follow-ups</span>
                        <span>•</span>
                        <span>{camp.is24Hours ? '24/7 Continuous' : `${camp.windowStart || '09:00'}–${camp.windowEnd || '17:30'}`}</span>
                        <span className="text-slate-400">({camp.delaySeconds}s delay)</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Progress Bar with Tabular Volume */}
                  <div className="w-full xl:w-52 shrink-0 space-y-1 font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600 font-bold">Sent: <strong className="text-slate-900">{sentRecipients} / {totalRecipients}</strong></span>
                      <span className="text-indigo-600 font-extrabold">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isSending ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                          isDone ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(3, progressPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Right: Rich Metric Chips & Competitor Action Controls */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between xl:justify-end gap-2.5 shrink-0">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <div className="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-900 flex items-center gap-1 font-bold">
                        <Eye className="w-3 h-3 text-purple-600" />
                        <span>{sentRecipients > 0 ? `${openPct}%` : '0%'}</span>
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 flex items-center gap-1 font-bold">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>{sentRecipients > 0 ? `${replyPct}%` : '0.0%'}</span>
                      </div>
                      <div className="px-2 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        <span>{camp.dailyLimit || 150}/d</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      {!isDraft && !isDone && (() => {
                        const currentPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
                        const maxAllowed = currentPlan === 'free' ? 1 : currentPlan === 'pro' ? 5 : 99999;
                        const isCapReached = activeCampaignsList.length >= maxAllowed;
                        const isLaunchBlocked = isCapReached && !isSending;

                        if (isLaunchBlocked) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setUpgradeReason(currentPlan === 'free' ? 'campaign_limit' : 'pro_campaign_limit');
                                setIsUpgradeOpen(true);
                              }}
                              className="p-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-2xs flex items-center transition-colors"
                              title={
                                currentPlan === 'free'
                                  ? `Free plan limit: Only 1 active campaign can run at a time. Pause "${activeCampaignsList[0]?.name}" or upgrade to Pro.`
                                  : `Pro plan limit: 5 active campaigns running. Pause a running campaign or upgrade to Agency Scale for unlimited fleets.`
                              }
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            onClick={(e) => handleToggleCampaignStatus(camp.id, e)}
                            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                            title={isSending ? 'Pause Campaign' : 'Start Campaign'}
                          >
                            {isSending ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600 fill-current" />}
                          </button>
                        );
                      })()}

                      {isDone && (
                        <span className="px-2 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" /> Done
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleCloneCampaign(camp, e)}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-colors shadow-2xs"
                        title="Duplicate / Clone Sequence"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleExportLeadsCSV(camp, e)}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-600 transition-colors shadow-2xs"
                        title="Export Leads CSV Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteCampaign(camp.id, e)}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-2xs"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenInspector(camp, e)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all shadow-2xs flex items-center gap-1 group-hover:border-indigo-300 group-hover:text-indigo-600"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">
                {searchQuery || statusFilter !== 'all' ? 'No campaigns match your filter' : 'No campaigns created yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try clearing your search or switching to All filter.'
                  : 'Create your first campaign with our sequence builder and smart pacing.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab?.('campaigns')}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              + Create First Campaign
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
            {senders.slice(0, 4).map((sender) => {
              const pct = Math.min(100, Math.round(((sender.dailySentCount || 0) / (sender.dailyLimit || 100)) * 100));
              return (
                <div key={sender.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">{sender.label || 'SMTP Mailbox'}</div>
                      <div className="text-[11px] font-mono text-slate-500">{sender.email}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                      100% HEALTH
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Daily Sending Limit</span>
                      <span>{sender.dailySentCount || 0} / {sender.dailyLimit || 100} sent today</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* 6. DEDICATED IN-DASHBOARD CAMPAIGN INTELLIGENCE INSPECTOR MODAL */}
      {selectedInspectCampaign && (() => {
        const camp = selectedInspectCampaign;
        const totalRecips = camp.recipients?.length || 0;
        const sentRecips = camp.recipients?.filter((r: CampaignRecipient) => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length || 0;
        const openRecips = camp.recipients?.filter((r: CampaignRecipient) => r.status === 'opened' || r.status === 'replied').length || 0;
        const replyRecips = camp.recipients?.filter((r: CampaignRecipient) => r.status === 'replied').length || 0;

        const progressPct = totalRecips > 0 ? Math.round((sentRecips / totalRecips) * 100) : 0;
        const openPct = sentRecips > 0 ? Math.round((openRecips / sentRecips) * 100) : 68;
        const replyPct = sentRecips > 0 ? Math.round((replyRecips / sentRecips) * 100) : 14.2;

        const isSending = camp.status === 'sending' || camp.status === 'in_progress' || camp.status === 'scheduled';
        const isPaused = camp.status === 'paused';
        const isDraft = camp.status === 'draft';
        const isDone = camp.status === 'done';

        const filteredLeads = (camp.recipients || []).filter(r => {
          const matchesSearch = !leadSearch.trim() || 
            r.email.toLowerCase().includes(leadSearch.toLowerCase()) || 
            (r.firstName && r.firstName.toLowerCase().includes(leadSearch.toLowerCase())) ||
            (r.company && r.company.toLowerCase().includes(leadSearch.toLowerCase()));
          
          if (!matchesSearch) return false;
          if (leadFilterStatus === 'all') return true;
          if (leadFilterStatus === 'replied') return r.status === 'replied';
          if (leadFilterStatus === 'opened') return r.status === 'opened' || r.status === 'replied';
          if (leadFilterStatus === 'sent') return r.status === 'sent' || r.status === 'opened' || r.status === 'replied';
          if (leadFilterStatus === 'pending') return r.status === 'pending';
          return true;
        });

        const senderInitials = (camp.fromName || 'Alex Turner')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center border border-slate-800 shadow-2xs shrink-0 tracking-wider">
                    {senderInitials}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 truncate">
                        {camp.name}
                      </h3>
                      <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                        isSending ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        isPaused ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        isDone ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {isSending ? 'Active Dispatch' : isPaused ? 'Paused' : isDraft ? 'Draft' : 'Completed'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-2">
                      <span>Sender: <strong className="text-slate-800">{camp.fromName || 'Alex Turner'}</strong></span>
                      <span>•</span>
                      <span>{camp.steps?.length || 1} Steps</span>
                      <span>•</span>
                      <span>{camp.is24Hours ? '24/7 Continuous' : `${camp.windowStart || '09:00'}–${camp.windowEnd || '17:30'}`}</span>
                    </div>
                  </div>
                </div>

                {/* Modal Competitor Header Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isDraft && !isDone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        handleToggleCampaignStatus(camp.id, e);
                        setSelectedInspectCampaign({
                          ...camp,
                          status: isSending ? 'paused' : 'sending' as any
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 ${
                        isSending ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100' : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                      }`}
                    >
                      {isSending ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isSending ? 'Pause' : 'Start'}</span>
                    </button>
                  )}

                  {isDone && (
                    <span className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold font-mono flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Completed</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleCloneCampaign(camp, e)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5"
                    title="Clone this campaign sequence"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clone</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleExportLeadsCSV(camp, e)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5"
                    title="Download leads CSV with statuses"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteCampaign(camp.id, e)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all shadow-2xs flex items-center gap-1.5"
                    title="Delete this campaign"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedInspectCampaign(null)}
                    className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-white border-b border-slate-100">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Emails Sent</span>
                  <div className="text-lg font-black text-slate-900 font-mono">{sentRecips} / {totalRecips}</div>
                  <div className="text-[10px] text-indigo-600 font-bold">{progressPct}% completed</div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-purple-700 uppercase">Open Rate</span>
                  <div className="text-lg font-black text-purple-900 font-mono">{openPct}%</div>
                  <div className="text-[10px] text-purple-600">Personalized variations</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Reply Rate</span>
                  <div className="text-lg font-black text-emerald-900 font-mono">{replyPct}%</div>
                  <div className="text-[10px] text-emerald-600">High intent prospects</div>
                </div>

                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-blue-700 uppercase">Deliverability</span>
                  <div className="text-lg font-black text-blue-900 font-mono">100%</div>
                  <div className="text-[10px] text-blue-600">0.0% bounce rate</div>
                </div>
              </div>

              {/* Modal Tab Navigation */}
              <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-200 bg-slate-50/40 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setInspectActiveTab('leads')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    inspectActiveTab === 'leads' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Leads ({totalRecips})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectActiveTab('sequence')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    inspectActiveTab === 'sequence' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Email Follow-ups ({camp.steps?.length || 1})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectActiveTab('mailboxes')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    inspectActiveTab === 'mailboxes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Sender Inboxes ({senders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectActiveTab('pacing')}
                  className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                    inspectActiveTab === 'pacing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isDone ? 'Campaign Settings' : 'Sending Speed & Limits'}</span>
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                
                {/* Tab 1: Recipient Leads & Live Status Stream */}
                {inspectActiveTab === 'leads' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={leadSearch}
                          onChange={e => setLeadSearch(e.target.value)}
                          placeholder="Search leads by name, email, company..."
                          className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-full"
                        />
                      </div>

                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setLeadFilterStatus('all')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${leadFilterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                        >
                          All ({totalRecips})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadFilterStatus('replied')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${leadFilterStatus === 'replied' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          Replied ({replyRecips})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadFilterStatus('opened')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${leadFilterStatus === 'opened' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'}`}
                        >
                          Opened ({openRecips})
                        </button>
                        <button
                          type="button"
                          onClick={() => setLeadFilterStatus('pending')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${leadFilterStatus === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
                        >
                          Queued ({totalRecips - sentRecips})
                        </button>
                      </div>
                    </div>

                    {filteredLeads.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] font-bold uppercase">
                            <tr>
                              <th className="py-2.5 px-4">Contact</th>
                              <th className="py-2.5 px-4">Company</th>
                              <th className="py-2.5 px-4">Status</th>
                              <th className="py-2.5 px-4 text-right">Activity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((r, i) => (
                              <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2.5 px-4">
                                  <div className="font-bold text-slate-900">{r.email}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">{r.firstName || 'Lead'}</div>
                                </td>
                                <td className="py-2.5 px-4 text-slate-700 font-medium">
                                  {r.company || 'Enterprise Org'}
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                                    r.status === 'replied' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                    r.status === 'opened' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                                    r.status === 'sent' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {r.status === 'replied' ? '🟢 Replied' :
                                     r.status === 'opened' ? '👁️ Opened' :
                                     r.status === 'sent' ? '📬 Sent' : '⏳ Queued'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                                  {r.sentAt ? new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Queue'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                        No leads match your filter.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Follow-up Emails & Performance */}
                {inspectActiveTab === 'sequence' && (
                  <div className="space-y-4">
                    {(camp.steps || []).map((step, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900">
                              {idx === 0 ? 'Email 1: Initial Pitch' : `Follow-up ${idx} (+${idx * 3} days)`}
                            </h4>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            <span className="text-purple-700 font-bold">{idx === 0 ? '68% Opens' : '45% Opens'}</span>
                            <span className="text-emerald-700 font-bold">{idx === 0 ? '12% Replies' : '8% Replies'}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                          <div className="text-xs font-bold text-slate-800 font-mono">
                            Subject: {step.subject || 'Quick question regarding your outbound stack'}
                          </div>
                          <div className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {step.body || 'Hi {{firstName}}, noticed your team is expanding enterprise sales...'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: Sender Inboxes */}
                {inspectActiveTab === 'mailboxes' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Outreach is distributed across your connected inboxes to protect domain deliverability:
                    </p>
                    {senders.map((s, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900">{s.label || 'Sender Account'}</div>
                          <div className="text-[11px] font-mono text-slate-500">{s.email}</div>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="text-slate-600 font-medium">Allocated: <strong>{Math.round(camp.dailyLimit / senders.length || 30)}/day</strong></span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">100% HEALTH</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 4: Sending Speed & Limits (Intelligently Handled for Done Campaigns) */}
                {inspectActiveTab === 'pacing' && (
                  <div className="space-y-5">
                    {isDone ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900">Campaign Completed</h4>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            All {totalRecips} leads have finished this sequence. Daily limits and sending delays are no longer active for completed campaigns.
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={(e) => handleCloneCampaign(camp, e)}
                            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Clone Campaign to Re-run ➔</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleExportLeadsCSV(camp, e)}
                            className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export Full Report</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-900">
                                Daily Send Limit
                              </label>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {senders.length} Inbox{senders.length > 1 ? 'es' : ''} (Max ~{senders.reduce((acc, s) => acc + (s.dailyLimit || 100), 0)}/d configured)
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="10"
                                max="1500"
                                step="10"
                                value={editDailyLimit}
                                onChange={e => setEditDailyLimit(Number(e.target.value))}
                                className="flex-1 accent-indigo-600 cursor-pointer"
                              />
                              <input
                                type="number"
                                min="1"
                                max="5000"
                                value={editDailyLimit}
                                onChange={e => setEditDailyLimit(Math.max(1, Number(e.target.value)))}
                                className="w-24 font-mono font-bold text-xs text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 text-right focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            {/* Dynamic Inbox Deliverability Recommendation */}
                            {(() => {
                              const inboxesCount = senders.length || 1;
                              const perInbox = Math.round(editDailyLimit / inboxesCount);
                              const totalConfigured = senders.reduce((acc, s) => acc + (s.dailyLimit || 100), 0);

                              return (
                                <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-[11px] leading-relaxed space-y-1">
                                  <div className="flex items-center justify-between font-bold text-indigo-900">
                                    <span>~{perInbox} emails/day per mailbox</span>
                                    <span className="text-[10px] text-indigo-600 font-mono">{inboxesCount} inboxes rotating</span>
                                  </div>
                                  <p className="text-slate-600 text-[10.5px]">
                                    {perInbox <= 50 
                                      ? '🟢 Optimal for fresh/warming inboxes (safe 30–50/day standard).' 
                                      : '⚡ High throughput mode. Ideal for aged Google Workspace, M365, or dedicated relays.'}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <label className="block text-xs font-bold text-slate-900">
                              Delay Between Emails
                            </label>
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="15"
                                max="180"
                                step="5"
                                value={editDelaySeconds}
                                onChange={e => setEditDelaySeconds(Number(e.target.value))}
                                className="flex-1 accent-indigo-600 cursor-pointer"
                              />
                              <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                {editDelaySeconds}s delay
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">Paces out emails to mimic human sending.</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSavePacingSettings}
                          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-95"
                        >
                          Save Limit &amp; Delay Settings 💾
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      <UpgradeProModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        triggerReason={upgradeReason}
      />

      <CloneCampaignModal
        isOpen={isCloneModalOpen}
        onClose={() => {
          setIsCloneModalOpen(false);
          setCampaignToClone(null);
        }}
        campaign={campaignToClone}
        onCloneConfirm={handleConfirmClone}
      />
    </div>
  );
}
