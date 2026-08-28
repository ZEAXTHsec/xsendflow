'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CampaignsTab from '@/components/tabs/CampaignsTab';
import LeadCleanerTab from '@/components/tabs/LeadCleanerTab';
import SequenceStudioTab from '@/components/tabs/SequenceStudioTab';
import PitchPageBuilderTab from '@/components/tabs/PitchPageBuilderTab';
import AnalyticsTab from '@/components/tabs/AnalyticsTab';
import DesktopExportModal from '@/components/export/DesktopExportModal';
import ProfileSettingsModal from '@/components/settings/ProfileSettingsModal';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import { Lead, SequenceStep, PitchPageConfig } from '@/lib/types';
import { Mail, Sparkles, Zap, Monitor, BarChart3, Download, Settings } from 'lucide-react';

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'cleaner' | 'sequence' | 'pitch' | 'analytics'>('campaigns');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Header />

      {/* Studio Sub-Header Rail */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 sm:px-6 py-3.5 sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sub Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'campaigns'
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Campaigns &amp; Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('cleaner')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'cleaner'
                  ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Lead Sanitizer</span>
              {leads.length > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.2 rounded-full font-mono font-bold">
                  {leads.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sequence')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'sequence'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Spintax Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('pitch')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'pitch'
                  ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-purple-600" />
              <span>4. Pitch Pages</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-white text-purple-700 shadow-sm border border-purple-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>5. Analytics</span>
            </button>
          </div>

          {/* Quick Settings & Export Triggers */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0 shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Senders &amp; API Settings</span>
            </button>

            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0 glow-tag"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6" suppressHydrationWarning>
        {activeTab === 'campaigns' && (
          <CampaignsTab
            leads={leads}
            onImportLeadsToStudio={(newLeads) => {
              setLeads(newLeads);
              setActiveTab('cleaner');
            }}
          />
        )}

        {activeTab === 'cleaner' && (
          <LeadCleanerTab
            leads={leads}
            setLeads={setLeads}
            onProceedToSequence={() => setActiveTab('sequence')}
          />
        )}

        {activeTab === 'sequence' && (
          <SequenceStudioTab
            sequence={sequence}
            setSequence={setSequence}
            onProceedToPitch={() => setActiveTab('pitch')}
          />
        )}

        {activeTab === 'pitch' && (
          <PitchPageBuilderTab
            leads={leads}
            pitchConfig={pitchConfig}
            setPitchConfig={setPitchConfig}
            onProceedToAnalytics={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsTab />}
      </main>

      <Footer />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <DesktopExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        leads={leads}
        sequence={sequence}
        pitchConfig={pitchConfig}
      />

      <OnboardingTour
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
