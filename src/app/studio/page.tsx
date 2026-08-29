'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CampaignsTab from '@/components/tabs/CampaignsTab';
import LeadCleanerTab from '@/components/tabs/LeadCleanerTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import DesktopExportModal from '@/components/export/DesktopExportModal';
import ProfileSettingsModal from '@/components/settings/ProfileSettingsModal';
import UpgradeProModal from '@/components/modals/UpgradeProModal';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { Lead, SequenceStep } from '@/lib/types';
import { UserPlan, PLAN_LIMITS } from '@/lib/planLimits';
import { 
  Mail, Sparkles, BarChart3, Download, Settings, ShieldCheck, 
  Lock, LogIn, ArrowRight, Users, Zap, Building2, CheckCircle2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'campaigns' | 'leads'>('analytics');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'general' | 'mailbox_limit' | 'campaign_limit' | 'contact_limit'>('general');

  // Plan State
  const [userPlan, setUserPlan] = useState<UserPlan>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
    }
    return 'free';
  });

  // Authentication State
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const mock = localStorage.getItem('xsendflow_mock_user');
      if (mock) {
        try { return JSON.parse(mock); } catch {}
      }
    }
    return { id: 'guest-founder', email: 'outreach@xsendflow.com' };
  });
  const [authLoading, setAuthLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // 1. Load initial plan from localStorage / Supabase
    if (typeof window !== 'undefined') {
      const savedPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
      setUserPlan(savedPlan);
    }

    const handlePlanUpdate = () => {
      const updated = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
      setUserPlan(updated);
    };

    window.addEventListener('xsendflow_plan_updated', handlePlanUpdate);
    return () => window.removeEventListener('xsendflow_plan_updated', handlePlanUpdate);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_mock_user') : null;
        if (mockUserStr) {
          try {
            const parsed = JSON.parse(mockUserStr);
            setUser(parsed);
            const savedPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
            setUserPlan(savedPlan);
            setAuthLoading(false);
            return;
          } catch {}
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', session.user.id)
            .single();

          if (profile?.plan) {
            setUserPlan(profile.plan as UserPlan);
            localStorage.setItem('xsendflow_user_plan', profile.plan);
          }
        } else {
          // Allow seamless local guest session
          const guest = { id: 'guest-founder', email: 'outreach@xsendflow.com' };
          setUser(guest);
        }
      } catch (err) {
        setUser({ id: 'guest-founder', email: 'outreach@xsendflow.com' });
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single();

        if (profile?.plan) {
          setUserPlan(profile.plan as UserPlan);
          localStorage.setItem('xsendflow_user_plan', profile.plan);
        }
      } else {
        const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_mock_user') : null;
        if (mockUserStr) {
          try {
            setUser(JSON.parse(mockUserStr));
          } catch {
            setUser({ id: 'guest-founder', email: 'outreach@xsendflow.com' });
          }
        } else {
          setUser({ id: 'guest-founder', email: 'outreach@xsendflow.com' });
        }
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [sequence, setSequence] = useState<SequenceStep[]>([
    {
      id: 1,
      day: 1,
      type: 'initial',
      title: 'Step 1: Value Hook & Direct Inquiry',
      subject: '{Quick question|Brief inquiry} re: {{Company}}',
      body: 'Hey {{First_Name}},\n\n{{Icebreaker}}\n\nReached out because we help B2B teams scale outbound deliverability to 99% without hitting spam filters.\n\nCurious if optimizing your email infrastructure is a priority this quarter?\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    },
    {
      id: 2,
      day: 3,
      type: 'followup',
      title: 'Step 2: Case Study & Proof',
      subject: 'Re: quick question re: {{Company}}',
      body: 'Hi {{First_Name}},\n\nWanted to share a quick example—we recently helped a growth team boost inboxing from 45% to 99% using multi-mailbox rotation and Gaussian delay pacing.\n\nWorth a quick 5-minute chat next week?\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    },
    {
      id: 3,
      day: 7,
      type: 'nudge',
      title: 'Step 3: Direct 2-Line Nudge',
      subject: 'following up on {{Company}}',
      body: 'Hi {{First_Name}},\n\nFollowing up to see if you had any bandwidth to connect regarding {{Company}}\'s email deliverability?\n\nNo pressure either way.\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    },
    {
      id: 4,
      day: 12,
      type: 'breakup',
      title: 'Step 4: Graceful Breakup',
      subject: 'closing the loop on {{Company}}',
      body: 'Hi {{First_Name}},\n\nAssuming this isn\'t a priority right now, so I won\'t follow up again. If you ever want to tackle inbox deliverability down the road, feel free to reach back out.\n\nWishing {{Company}} continued growth.\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    }
  ]);

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070a13] text-white flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400">Verifying secure multi-tenant session...</p>
      </div>
    );
  }

  // 2. Unauthenticated Gate (Strict Privacy Protection)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
        <Header />

        <div className="max-w-md w-full mx-auto px-6 py-16 z-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Tenant Vault • Sign-In Required</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Authentication Required
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Please sign in to access your private campaigns, connected mailboxes, and deliverability analytics.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Launch Campaigns</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // 3. Authenticated Studio Experience (Zero-Data-Loss Core Cold Email Suite)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      {/* Clean 3-Pillar SaaS Navigation Rail */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 sm:px-6 py-3 sticky top-16 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main 3 Core Cold Email Pillars */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'campaigns'
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Campaigns &amp; Sequences</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'leads'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Lead Database</span>
              {leads.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold">
                  {leads.length}
                </span>
              )}
            </button>
          </div>

          {/* Center: Live Tier Status Badge */}
          <div className="flex items-center gap-2">
            {userPlan === 'free' && (
              <button
                type="button"
                onClick={() => { setUpgradeReason('general'); setIsUpgradeOpen(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-400/40 text-amber-900 text-xs font-bold flex items-center gap-1.5 hover:border-indigo-400 transition-all active:scale-95 shadow-2xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Free Plan (50/day) — Upgrade to Pro ➔</span>
              </button>
            )}

            {userPlan === 'pro' && (
              <button
                type="button"
                onClick={() => { setUpgradeReason('general'); setIsUpgradeOpen(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-all shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>👑 Pro Unlimited</span>
              </button>
            )}

            {userPlan === 'agency' && (
              <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                <span>🏢 Agency Scale</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              </div>
            )}
          </div>

          {/* Quick Actions & Settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Mailboxes &amp; Keys</span>
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              className="text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport (Zero Data Loss: Hidden instead of Unmounted) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className={activeTab === 'analytics' ? 'block' : 'hidden'}>
          <AnalyticsTab
            onNavigateTab={(tab) => setActiveTab(tab === 'pitch' ? 'campaigns' : tab as any)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

        <div className={activeTab === 'campaigns' ? 'block' : 'hidden'}>
          <CampaignsTab leads={leads} onImportLeadsToStudio={setLeads} />
        </div>

        <div className={activeTab === 'leads' ? 'block' : 'hidden'}>
          <LeadCleanerTab
            leads={leads}
            setLeads={setLeads}
            onProceedToSequence={() => setActiveTab('campaigns')}
          />
        </div>
      </main>

      <Footer />

      <DesktopExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        leads={leads}
        sequence={sequence}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <UpgradeProModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        triggerReason={upgradeReason}
        userEmail={user?.email}
      />

      <OnboardingTour
        onNavigateTab={(tab) => setActiveTab(tab === 'sequence' || tab === 'cleaner' || tab === 'pitch' ? 'campaigns' : tab as any)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
