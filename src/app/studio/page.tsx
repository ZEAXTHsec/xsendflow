'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CampaignsTab from '@/components/tabs/CampaignsTab';
import LeadCleanerTab from '@/components/tabs/LeadCleanerTab';
import PitchPageBuilderTab from '@/components/tabs/PitchPageBuilderTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import DesktopExportModal from '@/components/export/DesktopExportModal';
import ProfileSettingsModal from '@/components/settings/ProfileSettingsModal';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { Lead, SequenceStep, PitchPageConfig } from '@/lib/types';
import { Mail, Sparkles, Monitor, BarChart3, Download, Settings, ShieldCheck, Lock, LogIn, ArrowRight, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'campaigns' | 'leads' | 'pitch'>('analytics');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Authentication State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
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
      title: 'Step 1: Value Hook & Custom Pitch Link',
      subject: '{Quick question|Brief inquiry} re: {{Company}}',
      body: 'Hey {{First_Name}},\n\n{{Icebreaker}}\n\nReached out because we help growth leaders scale outbound meetings without landing in spam.\n\nPut together a quick 60-second walkthrough tailored for {{Company}} here: {{Pitch_Page_URL}}\n\nWorth a quick chat?\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    },
    {
      id: 2,
      day: 3,
      type: 'followup',
      title: 'Step 2: Case Study & Proof',
      subject: 'Re: quick question re: {{Company}}',
      body: 'Hi {{First_Name}},\n\nWanted to share a quick example—we recently helped a B2B team boost inboxing from 45% to 99% within 10 days.\n\nCurious if optimizing email infrastructure is a focus for {{Company}} this quarter?\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    },
    {
      id: 3,
      day: 7,
      type: 'nudge',
      title: 'Step 3: Direct 2-Line Nudge',
      subject: 'following up on {{Company}}',
      body: 'Hi {{First_Name}},\n\nAny bandwidth to take a look at the custom walkthrough for {{Company}} ({{Pitch_Page_URL}})?\n\nNo pressure either way.\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    },
    {
      id: 4,
      day: 12,
      type: 'breakup',
      title: 'Step 4: Graceful Breakup',
      subject: 'closing the loop on {{Company}}',
      body: 'Hi {{First_Name}},\n\nAssuming this isn\'t a priority right now, so I won\'t follow up again. If you ever want to tackle deliverability down the road, feel free to reach back out.\n\nWishing {{Company}} continued growth.\n\nBest,\nYour Name',
      spamScore: 100,
      spamWordsFound: []
    }
  ]);

  const [pitchConfig, setPitchConfig] = useState<PitchPageConfig>({
    slug: 'demo',
    prospectName: 'Partner',
    companyName: 'Your Team',
    companyDomain: 'example.com',
    headline: 'Scale Outbound Pipeline Without Hitting Spam Filters',
    subheadline: 'A dedicated 60-second video walkthrough and implementation blueprint',
    bullets: [
      'Eliminate domain spam penalties with automated DNS alignment',
      'Generate unique Spintax variations on every single outgoing message',
      'Increase reply rates with 1-to-1 personalized pitch landing pages'
    ],
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
    ctaText: 'Book 15-Min Intro Call',
    calendarUrl: 'https://cal.com',
    themeColor: '#10b981'
  });

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

  // 3. Authenticated Studio Experience (Zero-Data-Loss Architecture)
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      {/* Unified SaaS Navigation Rail */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 sm:px-6 py-3 sticky top-16 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Main 4 SaaS Pillars */}
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
              <span>Campaigns</span>
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

            <button
              onClick={() => setActiveTab('pitch')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'pitch'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pitch Pages</span>
            </button>
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
            onNavigateTab={(tab) => setActiveTab(tab)}
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

        <div className={activeTab === 'pitch' ? 'block' : 'hidden'}>
          <PitchPageBuilderTab
            leads={leads}
            pitchConfig={pitchConfig}
            setPitchConfig={setPitchConfig}
            onProceedToAnalytics={() => setActiveTab('analytics')}
          />
        </div>
      </main>

      <Footer />

      <DesktopExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        leads={leads}
        sequence={sequence}
        pitchConfig={pitchConfig}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <OnboardingTour
        onNavigateTab={(tab) => setActiveTab(tab === 'sequence' || tab === 'cleaner' ? 'campaigns' : tab as any)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
