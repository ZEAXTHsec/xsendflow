'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import LeadCleanerTab from '@/components/tabs/LeadCleanerTab';
import CampaignsTab from '@/components/tabs/CampaignsTab';
import DesktopExportModal from '@/components/export/DesktopExportModal';
import ProfileSettingsModal from '@/components/settings/ProfileSettingsModal';
import UpgradeProModal from '@/components/modals/UpgradeProModal';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { 
  BarChart3, Users, Mail, Settings, Download, Zap, Sparkles, 
  Building2, ShieldCheck, Lock, LogIn, ArrowRight, Crown, Clock, User
} from 'lucide-react';
import { Lead, SequenceStep } from '@/lib/types';
import { UserPlan } from '@/lib/planLimits';
import { getStoredLicense, LicenseDetails } from '@/lib/licenseEngine';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AGENCY_MOCK_SENDERS, getAgencyMockCampaigns } from '@/lib/mockData/agencyMockData';

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'campaigns' | 'leads'>('analytics');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'billing' | 'senders' | 'api' | 'preferences'>('senders');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'general' | 'mailbox_limit' | 'campaign_limit' | 'contact_limit'>('general');

  // Plan & License State
  const [userPlan, setUserPlan] = useState<UserPlan>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
    }
    return 'free';
  });
  const [license, setLicense] = useState<LicenseDetails>(getStoredLicense);

  // Authentication State
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const mock = localStorage.getItem('xsendflow_mock_user');
      if (mock) {
        try { return JSON.parse(mock); } catch {}
      }
    }
    return null;
  });
  const [authLoading, setAuthLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Auto-purge any legacy mock test data left in browser storage
      try {
        const rawCamps = localStorage.getItem('xsendflow_campaigns_v2');
        if (rawCamps && (rawCamps.includes('Alex Turner') || rawCamps.includes('camp-fintech') || rawCamps.includes('ApexScale') || rawCamps.includes('agencygrowth.io') || rawCamps.includes('sender-agency-1') || rawCamps.includes('Synthetic'))) {
          localStorage.removeItem('xsendflow_campaigns_v2');
          window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
        }
        const rawSenders = localStorage.getItem('xsendflow_senders');
        if (rawSenders && (rawSenders.includes('alex.turner@agencygrowth.io') || rawSenders.includes('sender-agency-1') || rawSenders.includes('outboundscale.co'))) {
          localStorage.removeItem('xsendflow_senders');
          window.dispatchEvent(new Event('xsendflow_senders_updated'));
        }
      } catch {}

      const savedPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
      setUserPlan(savedPlan);
      setLicense(getStoredLicense());
    }

    const handlePlanUpdate = () => {
      const saved = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
      setUserPlan(saved);
      setLicense(getStoredLicense());
    };

    window.addEventListener('xsendflow_plan_updated', handlePlanUpdate);
    window.addEventListener('xsendflow_license_updated', handlePlanUpdate);
    return () => {
      window.removeEventListener('xsendflow_plan_updated', handlePlanUpdate);
      window.removeEventListener('xsendflow_license_updated', handlePlanUpdate);
    };
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K opens Settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSettingsTab('profile');
        setIsSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. First check if a real Supabase session exists (e.g. from Google OAuth)
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          // Clear mock storage so real authenticated user takes full effect
          localStorage.removeItem('xsendflow_mock_user');

          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', session.user.id)
            .single();

          if (profile?.plan) {
            setUserPlan(profile.plan as UserPlan);
            localStorage.setItem('xsendflow_user_plan', profile.plan);
          } else {
            // New Google OAuth user defaults to agency/pro for test or free
            const currentPlan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
            setUserPlan(currentPlan);
          }
          setAuthLoading(false);
          return;
        }

        // 2. If no real session, check mock session for local testing
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

        const guest = { id: 'guest-founder', email: 'outreach@xsendflow.com' };
        setUser(guest);
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
        localStorage.removeItem('xsendflow_mock_user');
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

  const [sequence] = useState<SequenceStep[]>([
    {
      id: 1,
      day: 0,
      type: 'initial',
      title: 'Initial Touch',
      subject: 'Quick question for {{First_Name}}',
      body: 'Hi {{First_Name}},\n\nI noticed you lead {{Company}} and wanted to reach out.',
      spamScore: 100,
      spamWordsFound: []
    }
  ]);

  // 1. Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col items-center justify-center">
        <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono font-bold text-slate-600">Loading your workspace...</p>
      </div>
    );
  }

  // 2. Unauthenticated Gate
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

  const userDisplayName = typeof window !== 'undefined' ? (localStorage.getItem('xsendflow_display_name') || (user.email ? user.email.split('@')[0] : 'Founder')) : 'Founder';

  // 3. Authenticated Studio Experience
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

          {/* Center: AAA Holographic Tier Status Badge */}
          <div className="flex items-center gap-2">
            {userPlan === 'free' && (
              <button
                type="button"
                onClick={() => { setUpgradeReason('general'); setIsUpgradeOpen(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-400/40 text-amber-900 text-xs font-bold flex items-center gap-1.5 hover:border-indigo-400 transition-all active:scale-95 shadow-2xs group"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500 group-hover:scale-110 transition-transform" />
                <span>Free Plan (50/day) — Upgrade to Pro ➔</span>
              </button>
            )}

            {userPlan === 'pro' && (
              <button
                type="button"
                onClick={() => { setSettingsTab('billing'); setIsSettingsOpen(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white border border-indigo-500/40 text-xs font-extrabold flex items-center gap-2 hover:border-indigo-400 transition-all shadow-md shadow-indigo-500/10"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>👑 Pro Unlimited</span>
                <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                  {license.daysRemaining}d left
                </span>
              </button>
            )}

            {userPlan === 'agency' && (
              <button
                type="button"
                onClick={() => { setSettingsTab('billing'); setIsSettingsOpen(true); }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-950 via-[#1e1505] to-slate-900 text-amber-200 border border-amber-500/40 text-xs font-black flex items-center gap-2 hover:border-amber-400 transition-all shadow-md shadow-amber-500/10"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>🏢 Agency Scale</span>
                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                  Enterprise
                </span>
              </button>
            )}
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSettingsTab('senders'); setIsSettingsOpen(true); }}
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
            onOpenSettings={() => { setSettingsTab('senders'); setIsSettingsOpen(true); }}
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
        initialTab={settingsTab}
        userEmail={user?.email}
        userId={user?.id}
      />

      <UpgradeProModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        triggerReason={upgradeReason}
        userEmail={user?.email}
        userId={user?.id}
      />

      <OnboardingTour
        onNavigateTab={(tab) => setActiveTab(tab === 'sequence' || tab === 'cleaner' || tab === 'pitch' ? 'campaigns' : tab as any)}
        onOpenSettings={() => { setSettingsTab('senders'); setIsSettingsOpen(true); }}
      />
    </div>
  );
}
