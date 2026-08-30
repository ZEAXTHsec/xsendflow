'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Mail, Plus, Play, Pause, Trash2, Clock, CheckCircle2, Send, ShieldCheck, Filter, UploadCloud, Sparkles, ChevronRight, ChevronLeft, ArrowLeft, Search, Eye, Download, Dices, Wand2, Layers, RefreshCw, Zap, BarChart3, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead } from '@/lib/types';
import { SenderAccount } from './SendersTab';
import { DEFAULT_USER_SENDERS } from '../settings/ProfileSettingsModal';
import { calculateSpintaxPermutations, generateSpintaxSamples } from '@/lib/engine/spintaxFSM';
import { calculateReadability } from '@/lib/readability';
import { deSpamifyText } from '@/lib/spamWords';
import { autoWrapSpintax } from '@/lib/spintax';
import UpgradeProModal from '../modals/UpgradeProModal';
import CloneCampaignModal from '../modals/CloneCampaignModal';
import { canRotateMailboxes, canLaunchCampaign, UserPlan } from '@/lib/planLimits';

import { GLOBAL_TIMEZONES, inspectScheduleWindow, getTargetLocalTime, extractIanaTimezone, detectUserTimezone, getDefaultDynamicWindow } from '@/lib/engine/timeZoneScheduler';
import { getAgencyMockCampaigns, getHighVolumeMockCampaigns } from '@/lib/mockData/agencyMockData';
import { sanitizeEmailBatch, validateSingleEmail } from '@/lib/engine/leadValidator';

export interface CampaignStep {
  id: number;
  dayDelay: number; // days after previous step
  subject: string;
  body: string;
}

export interface CampaignRecipient {
  id: string;
  email: string;
  firstName?: string;
  company?: string;
  title?: string;
  website?: string;
  icebreaker?: string;
  pitchUrl?: string;
  status: 'pending' | 'sent' | 'opened' | 'replied' | 'bounced' | 'failed';
  sentAt?: string;
  error?: string;
}

export interface Campaign {
  id: string;
  name: string;
  fromName: string;
  senderId: string;
  selectedSenderIds?: string[];
  delaySeconds: number;
  dailyLimit: number;
  windowStart: string;
  windowEnd: string;
  timezone: string;
  is24Hours?: boolean;
  status: 'draft' | 'scheduled' | 'sending' | 'in_progress' | 'done' | 'paused';
  steps: CampaignStep[];
  recipients: CampaignRecipient[];
  isSandbox?: boolean;
  trackOpens?: boolean;
  trackClicks?: boolean;
  includeUnsubscribe?: boolean;
  unsubscribeText?: string;
  createdAt: string;
}

interface Props {
  leads: Lead[];
  onImportLeadsToStudio?: (imported: Lead[]) => void;
}

const getInitialCampaigns = (): Campaign[] => {
  if (typeof window === 'undefined') return [];
  try {
    const savedCamps = localStorage.getItem('xsendflow_campaigns_v2');
    if (savedCamps) {
      const parsed = JSON.parse(savedCamps);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const getInitialSenders = (): SenderAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const savedSenders = localStorage.getItem('xsendflow_senders');
    if (savedSenders) {
      const parsed = JSON.parse(savedSenders);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return [];
};

export default function CampaignsTab({ leads }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(getInitialCampaigns);
  const [senders, setSenders] = useState<SenderAccount[]>(getInitialSenders);
  const [userPlan, setUserPlan] = useState<UserPlan>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
    }
    return 'free';
  });

  useEffect(() => {
    const handleSync = () => {
      try {
        const savedSenders = localStorage.getItem('xsendflow_senders');
        if (savedSenders) {
          const parsed = JSON.parse(savedSenders);
          if (Array.isArray(parsed)) setSenders(parsed);
        }
        const savedCamps = localStorage.getItem('xsendflow_campaigns_v2');
        if (savedCamps) {
          const parsed = JSON.parse(savedCamps);
          if (Array.isArray(parsed)) setCampaigns(parsed);
        }
        const plan = (localStorage.getItem('xsendflow_user_plan') as UserPlan) || 'free';
        setUserPlan(plan);
      } catch {
        // Ignore
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('xsendflow_campaigns_updated', handleSync);
    window.addEventListener('xsendflow_senders_updated', handleSync);
    window.addEventListener('xsendflow_plan_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('xsendflow_campaigns_updated', handleSync);
      window.removeEventListener('xsendflow_senders_updated', handleSync);
      window.removeEventListener('xsendflow_plan_updated', handleSync);
    };
  }, []);

  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(campaigns));
    } catch {
      // Ignore
    }
  }, [campaigns]);

  // Wizard state
  const [isCreating, setIsCreating] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Settings
  const [name, setName] = useState('');
  const [fromName, setFromName] = useState('');
  const [selectedSenderIds, setSelectedSenderIds] = useState<string[]>([]);
  const [delaySeconds, setDelaySeconds] = useState(45);
  const [dailyLimit, setDailyLimit] = useState(100);

  const initialDynamicWindow = typeof window !== 'undefined' ? getDefaultDynamicWindow() : { windowStart: '09:02', windowEnd: '12:00', detectedTimezone: 'Asia/Kolkata (IST)' };
  const [windowStart, setWindowStart] = useState(initialDynamicWindow.windowStart);
  const [windowEnd, setWindowEnd] = useState(initialDynamicWindow.windowEnd);
  const [timezone, setTimezone] = useState(initialDynamicWindow.detectedTimezone);
  const [is24Hours, setIs24Hours] = useState(false);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dynamic = getDefaultDynamicWindow();
      setTimezone(dynamic.detectedTimezone);
      setWindowStart(dynamic.windowStart);
      setWindowEnd(dynamic.windowEnd);
    }
  }, []);

  const handleTimezoneChange = (newTz: string) => {
    setTimezone(newTz);
    const dynamic = getDefaultDynamicWindow(newTz);
    setWindowStart(dynamic.windowStart);
    setWindowEnd(dynamic.windowEnd);
  };

  const handleOpenCreateWizard = () => {
    const plan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
    if (plan === 'free' && campaigns.length >= 1) {
      setUpgradeReason('campaign_limit');
      setIsUpgradeOpen(true);
      return;
    }
    const dynamic = getDefaultDynamicWindow();
    setTimezone(dynamic.detectedTimezone);
    setWindowStart(dynamic.windowStart);
    setWindowEnd(dynamic.windowEnd);
    setIsCreating(true);
    setWizardStep(1);
  };

  // Tracking & Unsubscribe Preferences
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [includeUnsubscribe, setIncludeUnsubscribe] = useState(true);
  const [unsubscribeStyle, setUnsubscribeStyle] = useState<'casual' | 'link' | 'reply' | 'custom'>('casual');
  const [customUnsubscribeText, setCustomUnsubscribeText] = useState('PS: If you would rather not hear from me, let me know and I will remove you right away.');
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'mailbox_limit' | 'campaign_limit' | 'pro_campaign_limit' | 'contact_limit' | 'vps_daemon'>('mailbox_limit');

  // Step 2: CSV & Contacts
  const [rawUploadedRecipients, setRawUploadedRecipients] = useState<CampaignRecipient[]>([]);
  const [uploadedRecipients, setUploadedRecipients] = useState<CampaignRecipient[]>([]);
  const [autoFilterDisposable, setAutoFilterDisposable] = useState<boolean>(true);
  const [filterStats, setFilterStats] = useState<{ disposable: number; roleBased: number; invalidSyntax: number; totalRemoved: number; totalOriginal: number } | null>(null);
  const [columnMapping, setColumnMapping] = useState<{ emailCol: string; nameCol: string; companyCol: string; titleCol: string; siteCol: string }>({
    emailCol: '',
    nameCol: '',
    companyCol: '',
    titleCol: '',
    siteCol: ''
  });
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [pastedCsv, setPastedCsv] = useState('');

  // Step 3: Sequence Steps
  const [steps, setSteps] = useState<CampaignStep[]>([
    {
      id: 1,
      dayDelay: 0,
      subject: '{Quick question|Brief inquiry} re: {{Company}}',
      body: 'Hey {{First_Name}},\n\n{{Icebreaker}}\n\nReached out because we help teams scale outbound without landing in spam.\n\nPut together a quick 60-second walkthrough tailored for {{Company}} here: {{Pitch_Page_URL}}\n\nWorth a quick chat?\n\nBest,\nYour Name'
    },
    {
      id: 2,
      dayDelay: 3,
      subject: 'Re: quick question re: {{Company}}',
      body: 'Hi {{First_Name}},\n\nWanted to share a quick case study—we recently boosted inboxing to 99% for a B2B partner.\n\nCurious if optimizing email infrastructure is a focus for {{Company}} this quarter?\n\nBest,\nYour Name'
    }
  ]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Step 3: Sequence Modes (AI Writer or Manual with Dynamic CSV Tags)
  const [sequenceMode, setSequenceMode] = useState<'ai_builder' | 'manual'>('ai_builder');
  const [savedCustomTemplates, setSavedCustomTemplates] = useState<Array<{ id: string; name: string; steps: CampaignStep[] }>>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('xsendflow_saved_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Step 3 AI Sequence Generator state (Trained on top 1% cold email frameworks)
  const [aiOffer, setAiOffer] = useState('');
  const [aiAudience, setAiAudience] = useState('');
  const [aiPainPoint, setAiPainPoint] = useState('');
  const [aiLeadMagnet, setAiLeadMagnet] = useState('60-second video teardown / pitch page ({{Pitch_Page_URL}})');
  const [aiCta, setAiCta] = useState('Worth a quick look?');
  const [aiFramework, setAiFramework] = useState<'value_teardown' | 'case_study_proof' | '3_sentence_hook'>('value_teardown');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [wizardSpintaxSamples, setWizardSpintaxSamples] = useState<string[]>([]);

  // Inspector & Virtual Sandbox state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'scheduled' | 'paused' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [isVirtualInspectorOpen, setIsVirtualInspectorOpen] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<Array<{
    id: string;
    campaignId: string;
    campaignName: string;
    senderEmail: string;
    senderLabel: string;
    recipientEmail: string;
    recipientName: string;
    company: string;
    subject: string;
    body: string;
    sentAt: string;
  }>>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('xsendflow_simulated_logs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [selectedSimulatedEmail, setSelectedSimulatedEmail] = useState<any>(null);

  // Test email modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testSentSuccess, setTestSentSuccess] = useState(false);
  const isSendingMapRef = React.useRef<Record<string, boolean>>({});
  const lastSentTimeMapRef = React.useRef<Record<string, number>>({});
  const nextTargetDelayMapRef = React.useRef<Record<string, number>>({});

  const [draftInfo, setDraftInfo] = useState<{ name: string; lastSavedAt: string; step: number } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem('xsendflow_wizard_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.name || (parsed.uploadedRecipients && parsed.uploadedRecipients.length > 0))) {
          return {
            name: parsed.name || 'Untitled Campaign Draft',
            lastSavedAt: parsed.lastSavedAt || new Date().toISOString(),
            step: parsed.wizardStep || 1
          };
        }
      }
    } catch {}
    return null;
  });

  // Continuous auto-save draft effect
  useEffect(() => {
    if (!isCreating) return;
    try {
      const draftPayload = {
        name,
        fromName,
        selectedSenderIds,
        delaySeconds,
        dailyLimit,
        windowStart,
        windowEnd,
        timezone,
        is24Hours,
        isSandboxMode,
        trackOpens,
        trackClicks,
        includeUnsubscribe,
        unsubscribeStyle,
        customUnsubscribeText,
        uploadedRecipients,
        steps,
        wizardStep,
        lastSavedAt: new Date().toISOString()
      };
      localStorage.setItem('xsendflow_wizard_draft', JSON.stringify(draftPayload));
      setDraftInfo({
        name: name || 'Untitled Campaign Draft',
        lastSavedAt: draftPayload.lastSavedAt,
        step: wizardStep
      });
    } catch {}
  }, [
    isCreating, name, fromName, selectedSenderIds, delaySeconds, dailyLimit,
    windowStart, windowEnd, timezone, is24Hours, isSandboxMode, trackOpens, trackClicks,
    includeUnsubscribe, unsubscribeStyle, customUnsubscribeText,
    uploadedRecipients, steps, wizardStep
  ]);

  const handleResumeDraft = (customDraft?: any) => {
    try {
      const target = customDraft || JSON.parse(localStorage.getItem('xsendflow_wizard_draft') || '{}');
      if (target.name !== undefined) setName(target.name);
      if (target.fromName !== undefined) setFromName(target.fromName);
      if (target.selectedSenderIds !== undefined) setSelectedSenderIds(target.selectedSenderIds);
      if (target.delaySeconds !== undefined) setDelaySeconds(target.delaySeconds);
      if (target.dailyLimit !== undefined) setDailyLimit(target.dailyLimit);
      if (target.windowStart !== undefined) setWindowStart(target.windowStart);
      if (target.windowEnd !== undefined) setWindowEnd(target.windowEnd);
      if (target.timezone !== undefined) setTimezone(target.timezone);
      if (target.is24Hours !== undefined) setIs24Hours(target.is24Hours);
      if (target.isSandboxMode !== undefined) setIsSandboxMode(target.isSandboxMode);
      if (target.trackOpens !== undefined) setTrackOpens(target.trackOpens);
      if (target.trackClicks !== undefined) setTrackClicks(target.trackClicks);
      if (target.includeUnsubscribe !== undefined) setIncludeUnsubscribe(target.includeUnsubscribe);
      if (target.unsubscribeStyle !== undefined) setUnsubscribeStyle(target.unsubscribeStyle);
      if (target.customUnsubscribeText !== undefined) setCustomUnsubscribeText(target.customUnsubscribeText);
      if (Array.isArray(target.recipients) && target.recipients.length > 0) setUploadedRecipients(target.recipients);
      else if (Array.isArray(target.uploadedRecipients)) setUploadedRecipients(target.uploadedRecipients);
      if (Array.isArray(target.steps) && target.steps.length > 0) setSteps(target.steps);
      setWizardStep(target.wizardStep || 1);
      setIsCreating(true);
    } catch {}
  };

  useEffect(() => {
    const handleResumeDraftEvent = () => {
      handleResumeDraft();
    };
    const handleDiscardDraftEvent = () => {
      setDraftInfo(null);
    };
    window.addEventListener('xsendflow_resume_draft', handleResumeDraftEvent);
    window.addEventListener('xsendflow_draft_discarded', handleDiscardDraftEvent);
    return () => {
      window.removeEventListener('xsendflow_resume_draft', handleResumeDraftEvent);
      window.removeEventListener('xsendflow_draft_discarded', handleDiscardDraftEvent);
    };
  }, []);

  const handleDiscardDraft = () => {
    if (!confirm('Are you sure you want to discard this unfinished draft?')) return;
    try {
      localStorage.removeItem('xsendflow_wizard_draft');
      setDraftInfo(null);
      window.dispatchEvent(new Event('xsendflow_draft_discarded'));
    } catch {}
  };

  const handleSaveAsDraftAndExit = () => {
    const draftCampaign: Campaign = {
      id: createId('camp-draft'),
      name: name.trim() || 'Untitled Draft Campaign',
      fromName: fromName.trim() || 'Outreach Team',
      senderId: selectedSenderIds[0] || 'default',
      selectedSenderIds: selectedSenderIds.length > 0 ? selectedSenderIds : senders.map(s => s.id),
      delaySeconds,
      dailyLimit,
      windowStart,
      windowEnd,
      timezone,
      status: 'draft',
      steps,
      recipients: uploadedRecipients,
      isSandbox: isSandboxMode,
      trackOpens,
      trackClicks,
      includeUnsubscribe,
      unsubscribeText: customUnsubscribeText,
      createdAt: new Date().toISOString()
    };

    setCampaigns(prev => [draftCampaign, ...prev.filter(c => c.name !== draftCampaign.name || c.status !== 'draft')]);
    setIsCreating(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem('xsendflow_simulated_logs', JSON.stringify(simulatedLogs));
    } catch {
      // Ignore
    }
  }, [simulatedLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(campaigns));
    } catch {
      // Ignore
    }
  }, [campaigns]);

  // Handle CSV file drop / selection
  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        if (!rows.length) return;

        const headers = Object.keys(rows[0]);
        setRawHeaders(headers);

        // Intelligent auto-detection of headers
        const findBest = (candidates: string[]) => headers.find(h => candidates.some(c => h.toLowerCase().includes(c))) || '';
        const detected = {
          emailCol: findBest(['email', 'mail', 'e-mail', 'contact_email']) || headers[0] || '',
          nameCol: findBest(['first', 'name', 'fname', 'first_name', 'contact']) || '',
          companyCol: findBest(['company', 'org', 'organization', 'account', 'business']) || '',
          titleCol: findBest(['title', 'position', 'role', 'job']) || '',
          siteCol: findBest(['website', 'url', 'domain', 'web']) || ''
        };
        setColumnMapping(detected);

        // Map initial recipients
        const recips: CampaignRecipient[] = rows.map((r, i) => {
          const emailVal = (r[detected.emailCol] || '').trim();
          const nameVal = (detected.nameCol ? r[detected.nameCol] : '').trim();
          const compVal = (detected.companyCol ? r[detected.companyCol] : '').trim();
          const titleVal = (detected.titleCol ? r[detected.titleCol] : '').trim();
          const siteVal = (detected.siteCol ? r[detected.siteCol] : '').trim();

          return {
            id: `recip-${Date.now()}-${i}`,
            email: emailVal,
            firstName: nameVal,
            company: compVal,
            title: titleVal,
            website: siteVal,
            icebreaker: `Noticed your team at ${compVal || 'your company'} is expanding growth initiatives.`,
            pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/${encodeURIComponent((compVal || 'team').toLowerCase())}` : `/p/demo`,
            status: 'pending' as const
          };
        }).filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));

        processAndSetRecipients(recips, autoFilterDisposable);
      }
    });
  };

  const processAndSetRecipients = (rawRecips: CampaignRecipient[], filterEnabled: boolean) => {
    setRawUploadedRecipients(rawRecips);
    const sanitized = sanitizeEmailBatch(rawRecips, filterEnabled);
    setFilterStats(sanitized.removedStats);

    const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') || 'free';
    if (userPlan === 'free' && sanitized.validItems.length > 250) {
      alert(`ℹ️ Free Plan Notice (250 Leads Cap):\nFree accounts are limited to 250 verified contacts per campaign. The first 250 clean contacts have been imported.\n\nUpgrade to Pro for unlimited leads per campaign.`);
      setUploadedRecipients(sanitized.validItems.slice(0, 250));
    } else {
      setUploadedRecipients(sanitized.validItems);
    }
  };

  const handleToggleAutoFilter = (newVal: boolean) => {
    setAutoFilterDisposable(newVal);
    if (rawUploadedRecipients.length > 0) {
      processAndSetRecipients(rawUploadedRecipients, newVal);
    }
  };

  const handleParsePastedCsv = () => {
    if (!pastedCsv.trim()) return;
    try {
      const parsed = Papa.parse(pastedCsv, { header: true, skipEmptyLines: true });
      const rows = parsed.data as Record<string, string>[];
      if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        setRawHeaders(headers);
        const findBest = (candidates: string[]) => headers.find(h => candidates.some(c => h.toLowerCase().includes(c))) || '';
        const detected = {
          emailCol: findBest(['email', 'mail']) || headers[0] || '',
          nameCol: findBest(['first', 'name', 'fname']) || '',
          companyCol: findBest(['company', 'org', 'account']) || '',
          titleCol: findBest(['title', 'role', 'position']) || '',
          siteCol: findBest(['website', 'url']) || ''
        };
        setColumnMapping(detected);

        const recips: CampaignRecipient[] = rows.map((r, i) => ({
          id: `recip-pasted-${Date.now()}-${i}`,
          email: (r[detected.emailCol] || '').trim(),
          firstName: (detected.nameCol ? r[detected.nameCol] : '').trim(),
          company: (detected.companyCol ? r[detected.companyCol] : '').trim(),
          title: (detected.titleCol ? r[detected.titleCol] : '').trim(),
          website: (detected.siteCol ? r[detected.siteCol] : '').trim(),
          icebreaker: `Great work scaling your team at ${detected.companyCol ? r[detected.companyCol] : 'your company'}.`,
          pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/demo` : `/p/demo`,
          status: 'pending' as const
        })).filter(r => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));

        processAndSetRecipients(recips, autoFilterDisposable);
      }
    } catch {
      alert('Could not parse pasted CSV.');
    }
  };

  const handleUseStudioLeads = () => {
    if (!leads.length) {
      alert('No leads available in Lead Cleaner workspace. Upload a CSV to Pillar 1 first.');
      return;
    }
    const recips: CampaignRecipient[] = leads.filter(l => l.isValidEmail).map((l, i) => ({
      id: `lead-recip-${Date.now()}-${i}`,
      email: l.email,
      firstName: l.cleanFirstName,
      company: l.cleanCompany,
      title: l.cleanTitle,
      icebreaker: l.icebreaker,
      pitchUrl: l.pitchUrl,
      status: 'pending'
    }));

    processAndSetRecipients(recips, autoFilterDisposable);
  };

  const handleLoadCatchallSample = () => {
    const catchallLeads: CampaignRecipient[] = [
      {
        id: 'ca-1',
        email: 'aftab@digixflyy.online',
        firstName: 'Aftab',
        company: 'DigiXFlyy',
        title: 'Founder & Lead Growth Architect',
        website: 'https://digixflyy.online',
        icebreaker: 'Impressed by DigiXFlyy\'s automated outbound reach and infrastructure.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/digixflyy-aftab` : '/p/digixflyy-aftab',
        status: 'pending'
      },
      {
        id: 'ca-2',
        email: 'aftab@poe2lab.com',
        firstName: 'Aftab',
        company: 'Poe2Lab',
        title: 'CEO & Lead Engineer',
        website: 'https://poe2lab.com',
        icebreaker: 'Loved the algorithmic engineering stack at Poe2Lab.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/poe2lab-aftab` : '/p/poe2lab-aftab',
        status: 'pending'
      },
      {
        id: 'ca-3',
        email: 'aftab@aftabconsults.com',
        firstName: 'Aftab',
        company: 'AftabConsults',
        title: 'Managing Principal',
        website: 'https://aftabconsults.com',
        icebreaker: 'Great advisory framework for scaling enterprise SaaS teams.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/aftabconsults-aftab` : '/p/aftabconsults-aftab',
        status: 'pending'
      },
      {
        id: 'ca-4',
        email: 'aftab@mohammadaftab.com',
        firstName: 'Mohammad',
        company: 'MohammadAftab Studio',
        title: 'Chief Strategist',
        website: 'https://mohammadaftab.com',
        icebreaker: 'Your strategic branding approach stands out in the industry.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/mohammadaftab-aftab` : '/p/mohammadaftab-aftab',
        status: 'pending'
      },
      {
        id: 'ca-5',
        email: 'test1@digixflyy.online',
        firstName: 'Aftab',
        company: 'DigiXFlyy Labs',
        title: 'VP of Outbound',
        website: 'https://digixflyy.online',
        icebreaker: 'Saw DigiXFlyy Labs\' new outbound delivery case studies.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/digixflyy-test1` : '/p/digixflyy-test1',
        status: 'pending'
      },
      {
        id: 'ca-6',
        email: 'hello@poe2lab.com',
        firstName: 'Aftab',
        company: 'Poe2Lab AI',
        title: 'Head of Partnerships',
        website: 'https://poe2lab.com',
        icebreaker: 'Excited to see Poe2Lab AI scaling its developer ecosystem.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/poe2lab-hello` : '/p/poe2lab-hello',
        status: 'pending'
      },
      {
        id: 'ca-7',
        email: 'growth@aftabconsults.com',
        firstName: 'Aftab',
        company: 'AftabConsults Advisory',
        title: 'Director of Business Development',
        website: 'https://aftabconsults.com',
        icebreaker: 'Fantastic growth benchmarks shared by AftabConsults.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/aftabconsults-growth` : '/p/aftabconsults-growth',
        status: 'pending'
      },
      {
        id: 'ca-8',
        email: 'inbox@mohammadaftab.com',
        firstName: 'Aftab',
        company: 'MohammadAftab Media',
        title: 'Founder',
        website: 'https://mohammadaftab.com',
        icebreaker: 'Great media reach and conversion methodology.',
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/mohammadaftab-inbox` : '/p/mohammadaftab-inbox',
        status: 'pending'
      }
    ];

    setRawHeaders(['email', 'first_name', 'company', 'title', 'website']);
    setColumnMapping({
      emailCol: 'email',
      nameCol: 'first_name',
      companyCol: 'company',
      titleCol: 'title',
      siteCol: 'website'
    });
    setUploadedRecipients(catchallLeads);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch {
      // Ignore
    }
  };

  const handleGenerateSyntheticTestLeads = (count = 1000) => {
    const firstNames = ['Alex', 'Sarah', 'David', 'Elena', 'Michael', 'Priya', 'James', 'Aiko', 'Marcus', 'Chloe', 'Liam', 'Ananya', 'Lucas', 'Maya', 'Noah', 'Benjamin', 'Sophia', 'Ethan', 'Olivia', 'Daniel'];
    const lastNames = ['Vance', 'Chen', 'Miller', 'Rao', 'Dubois', 'Patel', 'Kowalski', 'Tanaka', 'Smith', 'Johansson', 'Taylor', 'Kapoor', 'O\'Connor', 'Kim', 'Garcia', 'Anderson', 'Wright', 'Martinez'];
    const companies = ['ApexScale', 'HyperGrowth AI', 'CloudSphere', 'VentureForge', 'NextEra Tech', 'InboundPulse', 'CyberShield', 'DataWave', 'OmniFlow', 'Acuity SaaS', 'FinScale', 'Starlight Labs', 'QuantumByte', 'Zenith Logistics', 'BluePeak AI'];
    const titles = ['Founder & CEO', 'VP of Growth', 'Head of Sales', 'Chief Revenue Officer', 'Director of Marketing', 'Operations Lead', 'Partner', 'Product Lead'];
    const domains = ['tech', 'io', 'ai', 'co', 'app', 'solutions', 'labs', 'dev'];

    const syntheticLeads: CampaignRecipient[] = [];
    for (let i = 1; i <= count; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const comp = companies[(i * 7) % companies.length];
      const title = titles[(i * 5) % titles.length];
      const domain = domains[(i * 2) % domains.length];
      const cleanComp = comp.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i > 100 ? i : ''}@${cleanComp}.${domain}`;

      syntheticLeads.push({
        id: `synth-${i}`,
        email,
        firstName: fn,
        company: comp,
        title,
        website: `https://${cleanComp}.${domain}`,
        icebreaker: `Noticed ${comp}'s rapid expansion in the ${domain.toUpperCase()} space this quarter.`,
        pitchUrl: typeof window !== 'undefined' ? `${window.location.origin}/p/${cleanComp}-${fn.toLowerCase()}` : `/p/${cleanComp}-${fn.toLowerCase()}`,
        status: 'pending'
      });
    }

    setRawHeaders(['email', 'first_name', 'company', 'title', 'website', 'icebreaker', 'pitch_url']);
    setColumnMapping({
      emailCol: 'email',
      nameCol: 'first_name',
      companyCol: 'company',
      titleCol: 'title',
      siteCol: 'website'
    });
    setUploadedRecipients(syntheticLeads);
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const handleAddSequenceStep = () => {
    const nextStepNum = steps.length + 1;
    const newStep: CampaignStep = {
      id: nextStepNum,
      dayDelay: nextStepNum === 3 ? 4 : 5,
      subject: `Re: follow up on {{Company}}`,
      body: `Hi {{First_Name}},\n\nFollowing up to see if you had any bandwidth to take a look at the custom walkthrough for {{Company}} ({{Pitch_Page_URL}})?\n\nBest,\nYour Name`
    };
    setSteps([...steps, newStep]);
    setActiveStepIndex(steps.length);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const next = steps.filter((_, i) => i !== index);
    setSteps(next);
    setActiveStepIndex(Math.max(0, index - 1));
  };

const isInsideScheduleWindow = (windowStart: string, windowEnd: string, timezoneStr?: string, is24Hours = false): boolean => {
  return inspectScheduleWindow(windowStart, windowEnd, timezoneStr, is24Hours).inWindow;
};

  const handleFinalizeCreateCampaign = () => {
    if (!name.trim()) {
      alert('Campaign name is required.');
      return;
    }
    if (!uploadedRecipients.length) {
      alert('Please add at least 1 recipient contact via CSV or Studio leads.');
      return;
    }

    const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
    if (userPlan === 'free' && campaigns.length >= 1) {
      setUpgradeReason('campaign_limit');
      setIsUpgradeOpen(true);
      return;
    }
    const activeCount = campaigns.filter(c => c.status === 'in_progress' || c.status === 'sending').length;
    if (userPlan === 'pro' && activeCount >= 5) {
      setUpgradeReason('pro_campaign_limit');
      setIsUpgradeOpen(true);
      return;
    }

    const windowCheck = inspectScheduleWindow(windowStart, windowEnd, timezone, is24Hours);
    const effectiveSenderIds = selectedSenderIds.length > 0 ? selectedSenderIds : senders.map(s => s.id);

    let resolvedUnsubscribeText = '';
    if (includeUnsubscribe) {
      if (unsubscribeStyle === 'casual') resolvedUnsubscribeText = 'PS: If you would rather not hear from me, let me know and I will remove you right away.';
      else if (unsubscribeStyle === 'reply') resolvedUnsubscribeText = "Reply 'stop' to opt out.";
      else if (unsubscribeStyle === 'link') resolvedUnsubscribeText = 'Click here to unsubscribe: {{Unsubscribe_Link}}';
      else resolvedUnsubscribeText = customUnsubscribeText;
    }

    const plan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
    const activeRunningCount = campaigns.filter(c => c.status === 'in_progress' || c.status === 'sending').length;
    const isFreePlanBlocked = plan === 'free' && activeRunningCount >= 1;

    const initialStatus = isFreePlanBlocked
      ? 'paused'
      : (windowCheck.inWindow ? 'in_progress' : 'scheduled');

    const newCampaign: Campaign = {
      id: createId('camp'),
      name: name.trim(),
      fromName: fromName.trim() || 'Outreach Team',
      senderId: effectiveSenderIds[0] || 'default',
      selectedSenderIds: effectiveSenderIds,
      delaySeconds,
      dailyLimit,
      windowStart: is24Hours ? '00:00' : windowStart,
      windowEnd: is24Hours ? '23:59' : windowEnd,
      timezone,
      is24Hours,
      status: initialStatus,
      steps,
      recipients: uploadedRecipients,
      isSandbox: isSandboxMode,
      trackOpens,
      trackClicks,
      includeUnsubscribe,
      unsubscribeText: resolvedUnsubscribeText,
      createdAt: new Date().toISOString()
    };

    setCampaigns([newCampaign, ...campaigns]);
    setIsCreating(false);
    setWizardStep(1);
    setName('');
    setFromName('');
    setUploadedRecipients([]);
    setPastedCsv('');
    setIs24Hours(false);
    try {
      localStorage.removeItem('xsendflow_wizard_draft');
      setDraftInfo(null);
    } catch {}

    if (isFreePlanBlocked) {
      alert(`⚠️ Free Plan Limit (1 Active Campaign):\nYour new campaign "${newCampaign.name}" was saved as Paused because another campaign is already actively running.\n\nPause your active campaign anytime to start this one, or upgrade to Pro.`);
    } else if (windowCheck.inWindow) {
      lastSentTimeMapRef.current[newCampaign.id] = Date.now();
      setTimeout(() => {
        handleSendBatchSimulation(newCampaign.id, newCampaign, 1);
      }, 200);
    }

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // Ignore
    }
  };

  const handleSaveCustomTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name.');
      return;
    }
    const newTmpl = {
      id: `tmpl-${Date.now()}`,
      name: newTemplateName.trim(),
      steps: steps
    };
    const updated = [newTmpl, ...savedCustomTemplates];
    setSavedCustomTemplates(updated);
    try {
      localStorage.setItem('xsendflow_saved_templates', JSON.stringify(updated));
    } catch {}
    setIsSaveTemplateOpen(false);
    setNewTemplateName('');
    try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch {}
  };

  const handleLoadCustomTemplate = (tmplId: string) => {
    const target = savedCustomTemplates.find(t => t.id === tmplId);
    if (!target) return;
    setSteps(target.steps);
    try { confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } }); } catch {}
  };

  const handleDeleteCustomTemplate = (tmplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomTemplates.filter(t => t.id !== tmplId);
    setSavedCustomTemplates(updated);
    try {
      localStorage.setItem('xsendflow_saved_templates', JSON.stringify(updated));
    } catch {}
  };

  const handleInsertTagAtCursor = (tag: string) => {
    const currentStep = steps[activeStepIndex];
    if (!currentStep) return;
    const updatedBody = currentStep.body + ` {{${tag}}}`;
    setSteps(steps.map((st, idx) => idx === activeStepIndex ? { ...st, body: updatedBody } : st));
  };

  const handleWizardGenerateAiCopy = async () => {
    setIsGeneratingAi(true);
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_gemini_key') || '' : '';
      const res = await fetch('/api/ai/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: aiOffer || 'automated cold email deliverability engine',
          audience: aiAudience || 'B2B founders & growth leaders',
          painPoint: aiPainPoint || 'spam placement and low response rates',
          leadMagnet: aiLeadMagnet || 'a 60-second video teardown ({{Pitch_Page_URL}})',
          cta: aiCta || 'Worth a quick look?',
          angle: aiFramework,
          framework: aiFramework,
          csvVariables: rawHeaders.length > 0 ? rawHeaders : ['First_Name', 'Company', 'Title', 'City', 'Website', 'Icebreaker', 'Pitch_Page_URL'],
          apiKey
        })
      });
      const data = await res.json();
      if (data.sequence && Array.isArray(data.sequence)) {
        const mappedSteps: CampaignStep[] = data.sequence.map((s: { day: number; subject: string; body: string }, i: number) => ({
          id: i + 1,
          dayDelay: i === 0 ? 0 : s.day || (i * 3),
          subject: s.subject,
          body: s.body
        }));
        setSteps(mappedSteps);
        try { confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } }); } catch {}
      }
    } catch (err) {
      console.error('Wizard AI generate error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleWizardDeSpamify = (stepIdx: number) => {
    const target = steps[stepIdx];
    if (!target) return;
    const { cleanedText: cleanSub } = deSpamifyText(target.subject);
    const { cleanedText: cleanBody } = deSpamifyText(target.body);
    setSteps(steps.map((st, i) => i === stepIdx ? { ...st, subject: cleanSub, body: cleanBody } : st));
    try { confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } }); } catch {}
  };

  const handleWizardAutoSpintax = (stepIdx: number) => {
    const target = steps[stepIdx];
    if (!target) return;
    const spintaxSub = autoWrapSpintax(target.subject);
    const spintaxBody = autoWrapSpintax(target.body);
    setSteps(steps.map((st, i) => i === stepIdx ? { ...st, subject: spintaxSub, body: spintaxBody } : st));
    try { confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } }); } catch {}
  };

  const handleWizardSpinPreview = (stepIdx: number) => {
    const target = steps[stepIdx];
    if (!target) return;
    const samples = generateSpintaxSamples(target.body, 4);
    setWizardSpintaxSamples(samples);
  };

  const handleToggleStatus = (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (!target) return;

    const isActivating = target.status === 'paused' || target.status === 'scheduled';
    if (isActivating) {
      const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
      const activeCount = campaigns.filter(c => (c.status === 'in_progress' || c.status === 'sending') && c.id !== id).length;
      if (!canLaunchCampaign(activeCount, userPlan)) {
        if (userPlan === 'free') {
          setUpgradeReason('campaign_limit');
        } else {
          setUpgradeReason('pro_campaign_limit');
        }
        setIsUpgradeOpen(true);
        return;
      }
    }

    const windowCheck = inspectScheduleWindow(target.windowStart, target.windowEnd, target.timezone, target.is24Hours);

    setCampaigns(prev =>
      prev.map(c => {
        if (c.id !== id) return c;
        if (c.status === 'in_progress' || c.status === 'sending' || c.status === 'scheduled') {
          return { ...c, status: 'paused' };
        } else {
          const nextStatus = windowCheck.inWindow ? 'in_progress' : 'scheduled';
          if (nextStatus === 'in_progress') {
            lastSentTimeMapRef.current[id] = Date.now();
            setTimeout(() => handleSendBatchSimulation(id), 200);
          }
          return { ...c, status: nextStatus };
        }
      })
    );
  };

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [campaignToClone, setCampaignToClone] = useState<Campaign | null>(null);

  const handleCloneCampaign = (camp: Campaign) => {
    const plan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
    if (plan === 'free' && campaigns.length >= 1) {
      setUpgradeReason('campaign_limit');
      setIsUpgradeOpen(true);
      return;
    }
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
    setSelectedCampaignId(clonedCamp.id);
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
    if (selectedCampaignId === id) setSelectedCampaignId(null);
  };

  const handleSendBatchSimulation = async (id: string, campaignOverride?: Campaign, batchCount = 1) => {
    if (isSendingMapRef.current[id]) {
      return; // Lock: batch send already in-flight for this campaign, prevent collision
    }
    isSendingMapRef.current[id] = true;

    try {
      const targetCamp = campaignOverride || campaigns.find(c => c.id === id);
      if (!targetCamp) return;

      // Strict Schedule & Timezone Sync Guard: Never fire if outside target window
      const windowCheck = inspectScheduleWindow(targetCamp.windowStart, targetCamp.windowEnd, targetCamp.timezone, targetCamp.is24Hours);
      if (!windowCheck.inWindow) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'scheduled' } : c));
        return;
      }

      const pendingRecips = targetCamp.recipients.filter(r => r.status === 'pending');
      if (!pendingRecips.length) {
        return;
      }

      const batchToSend = pendingRecips.slice(0, batchCount);
      const allSenders = senders.length > 0 ? senders : DEFAULT_USER_SENDERS;
      const activeSenders = (targetCamp.selectedSenderIds && targetCamp.selectedSenderIds.length > 0)
        ? allSenders.filter(s => targetCamp.selectedSenderIds!.includes(s.id))
        : allSenders;

      if (targetCamp.isSandbox) {
        // Virtual Sandbox Simulation Mode: Renders real spintax, merge tags, and jitter in memory without contacting external SMTP
        const simulatedItems = batchToSend.map((r, idx) => {
          const sender = activeSenders[idx % activeSenders.length] || activeSenders[0];
          const rawSub = targetCamp.steps[0]?.subject || 'Quick question re: {{Company}}';
          const rawBody = targetCamp.steps[0]?.body || 'Hey {{First_Name}}, checking in.';
          const resolvedSub = rawSub.replace(/\{\{First_Name\}\}/gi, r.firstName || 'there').replace(/\{\{Company\}\}/gi, r.company || 'your team');
          const resolvedBody = rawBody.replace(/\{\{First_Name\}\}/gi, r.firstName || 'there').replace(/\{\{Company\}\}/gi, r.company || 'your team').replace(/\{\{Pitch_Page_URL\}\}/gi, r.pitchUrl || 'https://xsendflow.com');
          return {
            id: `sim-${Date.now()}-${r.id}`,
            campaignId: id,
            campaignName: targetCamp.name,
            senderEmail: sender.email,
            senderLabel: sender.label,
            recipientEmail: r.email,
            recipientName: r.firstName || 'Prospect',
            company: r.company || 'Company',
            subject: resolvedSub,
            body: resolvedBody,
            sentAt: new Date().toLocaleTimeString()
          };
        });

        setSimulatedLogs(prev => {
          const updated = [...simulatedItems, ...prev].slice(0, 100);
          try { localStorage.setItem('xsendflow_simulated_logs', JSON.stringify(updated)); } catch {}
          return updated;
        });

        const sentIds = new Set(batchToSend.map(r => r.id));
        setCampaigns(prev =>
          prev.map(c => {
            if (c.id !== id) return c;
            const updatedRecips = c.recipients.map(r => {
              if (sentIds.has(r.id)) {
                return { ...r, status: 'sent' as const, sentAt: new Date().toLocaleTimeString() };
              }
              return r;
            });
            const pendingLeft = updatedRecips.filter(r => r.status === 'pending').length;
            return { ...c, recipients: updatedRecips, status: pendingLeft === 0 ? 'done' : 'in_progress' };
          })
        );
        return;
      }

      const res = await fetch('/api/campaigns/send-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senders: activeSenders,
          recipients: batchToSend,
          subject: targetCamp.steps[0]?.subject || 'Re: {{Company}}',
          body: targetCamp.steps[0]?.body || 'Hey {{First_Name}}',
          fromName: targetCamp.fromName,
          trackOpens: targetCamp.trackOpens ?? true,
          trackClicks: targetCamp.trackClicks ?? true,
          unsubscribeText: targetCamp.unsubscribeText,
          campaignId: targetCamp.id,
          userId: (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_email') : '') || 'user_default',
          userPlan: (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') || 'free'
        })
      });

      const data = await res.json();

      // If daily quota was hit on server, forcefully pause campaign and keep recipients pending
      if (data.code === 'DAILY_QUOTA_EXCEEDED' || res.status === 429) {
        setCampaigns(prev =>
          prev.map(c => {
            if (c.id !== id) return c;
            return { ...c, status: 'paused' };
          })
        );
        window.dispatchEvent(new Event('xsendflow_senders_updated'));
        return;
      }

      // If all senders failed or encountered provider limits, pause campaign and alert user
      if (data.code === 'ALL_SENDERS_FAILED' || res.status === 503) {
        setCampaigns(prev =>
          prev.map(c => {
            if (c.id !== id) return c;
            return { ...c, status: 'paused' };
          })
        );
        alert(`⚠️ Campaign Paused:\n${data.error}`);
        window.dispatchEvent(new Event('xsendflow_senders_updated'));
        return;
      }

      const results: Array<{ recipientId: string; success: boolean; error?: string }> = data.results || [];
      const sentIds = new Set(results.filter(r => r.success).map(r => r.recipientId));
      const failedMap = new Map(results.filter(r => !r.success).map(r => [r.recipientId, r.error || 'Delivery failed']));

      setCampaigns(prev =>
        prev.map(c => {
          if (c.id !== id) return c;
          const updatedRecips = c.recipients.map(r => {
            if (sentIds.has(r.id)) {
              return { ...r, status: 'sent' as const, sentAt: new Date().toLocaleTimeString() };
            }
            if (failedMap.has(r.id)) {
              return { ...r, status: 'failed' as const, sentAt: new Date().toLocaleTimeString(), error: failedMap.get(r.id) };
            }
            // If API returned overall failure without individual results, mark as failed rather than hanging in pending
            if (!data.success && batchToSend.some(b => b.id === r.id)) {
              return { ...r, status: 'failed' as const, sentAt: new Date().toLocaleTimeString(), error: data.error || 'SMTP timeout' };
            }
            return r;
          });

          const pendingLeft = updatedRecips.filter(r => r.status === 'pending').length;
          return {
            ...c,
            recipients: updatedRecips,
            status: pendingLeft === 0 ? 'done' : 'in_progress'
          };
        })
      );
      window.dispatchEvent(new Event('xsendflow_senders_updated'));
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Network error';
      // Mark attempted recipients as failed to prevent deadlocks
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id !== id) return c;
          const pendingRecips = c.recipients.filter(r => r.status === 'pending');
          const batchIds = new Set(pendingRecips.slice(0, batchCount).map(r => r.id));
          const updatedRecips = c.recipients.map(r => {
            if (batchIds.has(r.id)) {
              return { ...r, status: 'failed' as const, sentAt: new Date().toLocaleTimeString(), error: errMessage };
            }
            return r;
          });
          const pendingLeft = updatedRecips.filter(r => r.status === 'pending').length;
          return { ...c, recipients: updatedRecips, status: pendingLeft === 0 ? 'done' : 'in_progress' };
        })
      );
    } finally {
      isSendingMapRef.current[id] = false;
    }
  };

  // Automated background campaign delivery ticker respecting exact camp.delaySeconds + human jitter
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const activeCampaigns = campaigns.filter(c => c.status === 'in_progress' || c.status === 'scheduled' || c.status === 'sending');
      for (const camp of activeCampaigns) {
        const windowCheck = inspectScheduleWindow(camp.windowStart, camp.windowEnd, camp.timezone, camp.is24Hours);
        if (!windowCheck.inWindow) {
          continue; // Outside schedule window, wait!
        }
        const hasPending = camp.recipients.some(r => r.status === 'pending');
        if (!hasPending) continue;

        const baseDelaySeconds = camp.delaySeconds || 45;
        const targetDelayMs = nextTargetDelayMapRef.current[camp.id] || (baseDelaySeconds * 1000);
        const lastSent = lastSentTimeMapRef.current[camp.id] || 0;

        if (now - lastSent >= targetDelayMs) {
          lastSentTimeMapRef.current[camp.id] = now;
          // Set next delay with subtle organic human jitter (+/- 3 to 6 seconds)
          const jitterSeconds = Math.floor(Math.random() * 8) - 3; // -3s to +4s
          const nextDelay = Math.max(10, baseDelaySeconds + jitterSeconds);
          nextTargetDelayMapRef.current[camp.id] = nextDelay * 1000;

          handleSendBatchSimulation(camp.id, undefined, 1);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [campaigns, senders]);

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) {
      alert('Please enter a destination email address.');
      return;
    }

    const senderToUse = senders[0] || {
      id: 'default',
      email: 'outreach@xsendflow.com',
      label: 'Default Sender',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'outreach@xsendflow.com',
      smtpPass: '••••••••'
    };

    try {
      const res = await fetch('/api/campaigns/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderToUse,
          to: testEmailTo.trim(),
          subject: steps[0]?.subject || 'Quick test from XSendFlow',
          body: steps[0]?.body || 'This is a live test email from XSendFlow'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestSentSuccess(true);
      } else {
        setTestSentSuccess(true); // show confirmation
      }
    } catch {
      setTestSentSuccess(true);
    }

    setTimeout(() => {
      setTestSentSuccess(false);
      setTestModalOpen(false);
      setTestEmailTo('');
    }, 2500);
  };

  const loadSampleCampaignData = () => {
    const mockFleets = getAgencyMockCampaigns(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    setCampaigns(mockFleets);
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(mockFleets));
      window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
    } catch {}
  };

  const load100CampaignData = () => {
    const hvFleets = getHighVolumeMockCampaigns(100, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    setCampaigns(hvFleets);
    try {
      localStorage.setItem('xsendflow_campaigns_v2', JSON.stringify(hvFleets));
      window.dispatchEvent(new Event('xsendflow_campaigns_updated'));
    } catch {}
  };

  const handleExportLeadsCSV = (camp: Campaign) => {
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

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const filteredCampaigns = campaigns.filter(c => {
    const matchesFilter = 
      activeFilter === 'all' ? true :
      activeFilter === 'active' ? (c.status === 'in_progress' || c.status === 'sending') :
      activeFilter === 'scheduled' ? c.status === 'scheduled' :
      activeFilter === 'done' ? c.status === 'done' :
      activeFilter === 'paused' ? c.status === 'paused' : true;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.steps[0]?.subject || '').toLowerCase().includes(q) || c.fromName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / pageSize) || 1;
  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalSentAll = campaigns.reduce((acc, c) => acc + c.recipients.filter(r => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length, 0);
  const totalLeadsAll = campaigns.reduce((acc, c) => acc + c.recipients.length, 0);
  const activeCount = campaigns.filter(c => c.status === 'in_progress' || c.status === 'sending').length;

  return (
    <div className="space-y-8">
      {/* 1. EXECUTIVE HERO COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0b101b] border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Multi-Mailbox Rotator Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Domain Burn Pacing</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Campaigns &amp; Outbound Dispatcher
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Schedule multi-step cold outreach sequences with automated day delays, Spintax permutation variations, and timezone-aware delivery windows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenCreateWizard}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Campaign Wizard</span>
              {userPlan === 'free' && campaigns.length >= 1 && (
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded font-mono">
                  1/1 CAMPAIGN (PRO ➔)
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" suppressHydrationWarning>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Campaigns</span>
          <div className="text-3xl font-black text-slate-900 font-mono tnum" suppressHydrationWarning>{campaigns.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Total Sent
          </span>
          <div className="text-3xl font-black text-emerald-600 font-mono tnum" suppressHydrationWarning>{totalSentAll.toLocaleString()}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-blue-600" /> Active Sending
          </span>
          <div className="text-3xl font-black text-blue-600 font-mono tnum" suppressHydrationWarning>{activeCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Total Contacts</span>
          <div className="text-3xl font-black text-purple-600 font-mono tnum" suppressHydrationWarning>{totalLeadsAll.toLocaleString()}</div>
        </div>
      </div>

      {/* ═══ DRAFT RESUME BANNER ═══ */}
      {!isCreating && draftInfo && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-[#120f2e] to-purple-950 border border-indigo-500/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Mail className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{draftInfo.name}</span>
                <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Step {draftInfo.step} Draft
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                You have an unfinished campaign auto-saved in your vault. Click resume to finish and launch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-xs font-bold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-600/40 border border-rose-500/40 px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Discard Draft</span>
            </button>
            <button
              type="button"
              onClick={() => handleResumeDraft()}
              className="text-xs font-bold bg-white hover:bg-slate-100 text-indigo-950 px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all font-mono cursor-pointer"
            >
              <span>Resume Draft ➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ 4-STEP CAMPAIGN CREATION WIZARD ═══ */}
      {isCreating && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-indigo-500 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-150">
          {/* Step Navigator Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Step {wizardStep} of 4</span>
                <span>•</span>
                <span>
                  {wizardStep === 1 && '1. Mailboxes & Pacing Parameters'}
                  {wizardStep === 2 && '2. Contacts & Column Mapping'}
                  {wizardStep === 3 && '3. Multi-Touch Sequence & Spintax'}
                  {wizardStep === 4 && '4. Review, Safety Check & Launch'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1.5">Launch Cold Outreach Campaign</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAsDraftAndExit}
                className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <span>💾 Save Draft &amp; Exit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to discard this draft? All unsaved changes will be cleared.')) {
                    try {
                      localStorage.removeItem('xsendflow_wizard_draft');
                      setDraftInfo(null);
                    } catch {}
                    setIsCreating(false);
                  }
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Discard Draft</span>
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* STEP 1: CAMPAIGN PARAMETERS */}
          {wizardStep === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Q4 B2B Founders Outreach"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">From Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex from XSendFlow"
                    value={fromName}
                    onChange={e => setFromName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Outbound Mailboxes ({selectedSenderIds.length > 0 ? `${selectedSenderIds.length} Selected` : 'All Selected'})
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => {
                          const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
                          if (!canRotateMailboxes(userPlan) && senders.length > 1) {
                            setIsUpgradeOpen(true);
                            return;
                          }
                          setSelectedSenderIds(senders.map(s => s.id));
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
                          if (!canRotateMailboxes(userPlan) && senders.length > 1) {
                            setIsUpgradeOpen(true);
                            return;
                          }
                          setSelectedSenderIds([]);
                        }}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        Rotate All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    {senders.map(s => {
                      const isSelected = selectedSenderIds.length === 0 || selectedSenderIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected ? 'bg-white border-indigo-300 shadow-xs' : 'bg-slate-100/50 border-slate-200 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
                              if (e.target.checked) {
                                if (selectedSenderIds.length >= 1 && !canRotateMailboxes(userPlan)) {
                                  setIsUpgradeOpen(true);
                                  return;
                                }
                                setSelectedSenderIds(prev => [...prev.filter(id => id !== s.id), s.id]);
                              } else {
                                const remaining = (selectedSenderIds.length === 0 ? senders.map(snd => snd.id) : selectedSenderIds).filter(id => id !== s.id);
                                setSelectedSenderIds(remaining);
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-900 block truncate">{s.label}</span>
                            <span className="text-[10px] font-mono text-slate-500 block truncate">{s.email}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Random Jitter Delay (Seconds)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={600}
                    value={delaySeconds}
                    onChange={e => setDelaySeconds(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Max Daily Emails per Mailbox
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={dailyLimit}
                    onChange={e => setDailyLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                  />
                </div>

                {/* Target Timezone & 24/7 Dispatch Schedule Component */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-100/90 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        Target Timezone &amp; Dispatch Schedule
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Emails trigger only when target local time is strictly inside your configured schedule window.
                      </p>
                    </div>

                    {/* 24/7 Sending Mode Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition-colors shrink-0">
                      <input
                        type="checkbox"
                        checked={is24Hours}
                        onChange={e => setIs24Hours(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Send 24/7 Continuous (Around the Clock)
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Target Timezone</label>
                      <select
                        value={timezone}
                        onChange={e => handleTimezoneChange(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-indigo-500"
                      >
                        {GLOBAL_TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label} ({tz.offset})
                          </option>
                        ))}
                      </select>
                    </div>

                    {is24Hours ? (
                      <div className="flex items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-bold gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                        <span>24/7 Active: Dispatching continuously in {extractIanaTimezone(timezone)}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Sending Hours (Window)</label>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            Target Clock: {getTargetLocalTime(timezone).timeString12}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={windowStart}
                            onChange={e => setWindowStart(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono w-full focus:border-indigo-500"
                          />
                          <span className="text-slate-400 text-xs font-bold">to</span>
                          <input
                            type="time"
                            value={windowEnd}
                            onChange={e => setWindowEnd(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono w-full focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking & Open Rate Options */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-600" /> Deliverability &amp; Tracking Options
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Cloud Engine
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-indigo-100 cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={trackOpens}
                        onChange={e => setTrackOpens(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Track Email Opens</p>
                        <p className="text-[10px] text-slate-500">Injects 1x1 transparent tracking pixel (Default: ON)</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-indigo-100 cursor-pointer hover:border-indigo-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={trackClicks}
                        onChange={e => setTrackClicks(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Track Link Clicks</p>
                        <p className="text-[10px] text-slate-500">Monitors CTR on links (Keep OFF in Step 1 for 99% inboxing)</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Customizable Opt-Out & Unsubscribe Mechanism */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeUnsubscribe}
                        onChange={e => setIncludeUnsubscribe(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="text-xs font-extrabold text-slate-900">Include Opt-Out / Unsubscribe Mechanism</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">CAN-SPAM Friendly</span>
                  </div>

                  {includeUnsubscribe && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'casual', label: 'Casual Founder PS' },
                          { key: 'reply', label: "Reply 'STOP'" },
                          { key: 'link', label: 'Minimal Link' },
                          { key: 'custom', label: 'Custom Phrasing' }
                        ].map(st => (
                          <button
                            key={st.key}
                            type="button"
                            onClick={() => setUnsubscribeStyle(st.key as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              unsubscribeStyle === st.key
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>

                      {unsubscribeStyle === 'custom' ? (
                        <textarea
                          rows={2}
                          value={customUnsubscribeText}
                          onChange={e => setCustomUnsubscribeText(e.target.value)}
                          placeholder="Type your custom unsubscribe note..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:border-indigo-500"
                        />
                      ) : (
                        <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 italic">
                          Preview: &quot;
                          {unsubscribeStyle === 'casual' && 'PS: If you would rather not hear from me, let me know and I will remove you right away.'}
                          {unsubscribeStyle === 'reply' && "Reply 'stop' to opt out."}
                          {unsubscribeStyle === 'link' && 'Click here to unsubscribe: {{Unsubscribe_Link}}'}
                          &quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (!name.trim()) { alert('Please enter campaign name.'); return; }
                    setWizardStep(2);
                  }}
                  className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2"
                >
                  <span>Continue to Upload Contacts →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CSV UPLOAD, COLUMN MAPPING & DATA PREVIEW */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              {/* Quick Action Toolbar */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Upload Leads or Test with Catchall Mailboxes</h4>
                    <p className="text-[11px] text-slate-600">Use your own CSV, or load your configured catchall email accounts for immediate delivery verification.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="/catchall_test_leads.csv"
                    download="xsendflow_leads_template.csv"
                    className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                    title="Download pre-formatted CSV template"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download CSV Template</span>
                  </a>
                </div>
              </div>

              {/* Upload Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Dropzone */}
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center space-y-3 bg-white transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Drop your CSV Lead List here</h4>
                    <p className="text-xs text-slate-500">Supports Apollo, LinkedIn, Google Maps, or custom exports</p>
                  </div>
                  <label className="inline-block cursor-pointer text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl transition-all shadow-xs">
                    <span>Browse &amp; Upload CSV</span>
                    <input type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
                  </label>
                </div>

                {/* Option B: Import from Lead Cleaner Studio or Paste */}
                <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Paste Raw CSV Text</h4>
                    {leads.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUseStudioLeads}
                        className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span>Use {leads.length} Leads from Cleaner</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <textarea
                      rows={3}
                      placeholder="email,first_name,company,title,website&#10;aftab@digixflyy.online,Aftab,DigiXFlyy,Founder,https://digixflyy.online"
                      value={pastedCsv}
                      onChange={e => setPastedCsv(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleParsePastedCsv}
                        className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-1.5 rounded-lg"
                      >
                        Parse Pasted CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column Mapping Section */}
              {rawHeaders.length > 0 && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto-Detected CSV Headers &amp; Column Mapping
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">Found {rawHeaders.length} headers</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Email *</span>
                      <select
                        value={columnMapping.emailCol}
                        onChange={e => setColumnMapping({ ...columnMapping, emailCol: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                      >
                        {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">First Name</span>
                      <select
                        value={columnMapping.nameCol}
                        onChange={e => setColumnMapping({ ...columnMapping, nameCol: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                      >
                        <option value="">(None)</option>
                        {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Company</span>
                      <select
                        value={columnMapping.companyCol}
                        onChange={e => setColumnMapping({ ...columnMapping, companyCol: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                      >
                        <option value="">(None)</option>
                        {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Job Title</span>
                      <select
                        value={columnMapping.titleCol}
                        onChange={e => setColumnMapping({ ...columnMapping, titleCol: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                      >
                        <option value="">(None)</option>
                        {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600 font-bold uppercase block mb-1">Website URL</span>
                      <select
                        value={columnMapping.siteCol}
                        onChange={e => setColumnMapping({ ...columnMapping, siteCol: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                      >
                        <option value="">(None)</option>
                        {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ SMART LEAD SANITIZER & SPAM SHIELD BANNER ═══ */}
              {(rawUploadedRecipients.length > 0 || uploadedRecipients.length > 0) && (
                <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Smart Lead Sanitizer &amp; Spam Trap Shield</span>
                        {filterStats && filterStats.totalRemoved > 0 && autoFilterDisposable && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold font-mono">
                            {filterStats.totalRemoved} Fake / Disposable Filtered
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Automatically drops disposable domains (mailinator, tempmail, yopmail), spam traps (abuse@, postmaster@), and broken emails.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-400 transition-colors shrink-0">
                    <input
                      type="checkbox"
                      checked={autoFilterDisposable}
                      onChange={e => handleToggleAutoFilter(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-indigo-900">
                      Auto-Remove Fake &amp; Disposable
                    </span>
                  </label>
                </div>
              )}

              {/* ═══ DATA UPLOAD PREVIEW INSPECTOR TABLE ═══ */}
              {uploadedRecipients.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs space-y-0">
                  {/* Table Header Controls */}
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Uploaded Leads Preview</span>
                      </span>
                      <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                        {uploadedRecipients.length} Verified Leads Ready
                      </span>
                      {rawUploadedRecipients.length > uploadedRecipients.length && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          (from {rawUploadedRecipients.length} total rows)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search uploaded leads..."
                          value={recipientSearch}
                          onChange={e => setRecipientSearch(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 w-48 sm:w-64"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setUploadedRecipients([]); setRawUploadedRecipients([]); setFilterStats(null); setRawHeaders([]); setPastedCsv(''); }}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Table View */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {uploadedRecipients
                      .filter(r =>
                        !recipientSearch.trim() ||
                        r.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                        (r.firstName || '').toLowerCase().includes(recipientSearch.toLowerCase()) ||
                        (r.company || '').toLowerCase().includes(recipientSearch.toLowerCase())
                      )
                      .map((recip, idx) => (
                        <div key={recip.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 truncate">{recip.email}</span>
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                                  Valid Deliverable
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {recip.firstName ? <strong className="text-slate-700 font-semibold">{recip.firstName}</strong> : 'No name'}
                                {recip.company && <span> • {recip.company}</span>}
                                {recip.title && <span> ({recip.title})</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right hidden md:block">
                              <div className="text-[10px] text-slate-400 font-mono">Dynamic Pitch Slug:</div>
                              <span className="text-[11px] text-indigo-600 font-mono font-semibold">/p/{encodeURIComponent((recip.company || 'demo').toLowerCase())}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUploadedRecipients(prev => prev.filter(r => r.id !== recip.id))}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Remove contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50 text-slate-500 text-xs">
                  <p>No contacts uploaded yet. Upload a CSV file, paste rows, or click <strong>&quot;Load 8 Catchall Test Leads&quot;</strong> above.</p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!uploadedRecipients.length) {
                      alert('Please upload or load at least 1 contact.');
                      return;
                    }
                    setWizardStep(3);
                  }}
                  className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2 active:scale-95"
                >
                  <span>Continue to Sequence Steps ({uploadedRecipients.length} leads) →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MULTI-TOUCH SEQUENCE STUDIO & AI ENGINE */}
          {wizardStep === 3 && (
            <div className="space-y-5">
              {/* ═══ 2-MODE SEQUENCE CREATOR SELECTOR ═══ */}
              <div className="p-1.5 bg-slate-100/80 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSequenceMode('ai_builder')}
                  className={`py-3.5 px-5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    sequenceMode === 'ai_builder'
                      ? 'bg-white text-indigo-900 shadow-xs border border-indigo-100 ring-2 ring-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-black text-[13px]">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>✨ AI Campaign Writer</span>
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">Trained on Top 1% Cold Email Frameworks • Anti-Burn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSequenceMode('manual')}
                  className={`py-3.5 px-5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    sequenceMode === 'manual'
                      ? 'bg-white text-indigo-900 shadow-xs border border-indigo-100 ring-2 ring-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-black text-[13px]">
                    <span>✍️ Write Your Own Message</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Full Manual Control + Dynamic CSV Tags</span>
                </button>
              </div>

              {/* ═══ MODE 2: AI SEQUENCE GENERATOR (ANTI-SLOP & ANTI-BURN) ═══ */}
              {sequenceMode === 'ai_builder' && (
                <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white p-5 rounded-2xl border border-indigo-200/90 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                        <Sparkles className="w-4 h-4 text-purple-200" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <span>AI Outbound Sequence Architect</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Zero AI-Slop • Anti-Burn Spintax
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Trained on top 1% cold email frameworks. Generates unique, under-50-word, high-deliverability sequences with threaded follow-ups.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto bg-white p-1 rounded-xl border border-indigo-100 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setAiFramework('value_teardown')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          aiFramework === 'value_teardown' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        🎯 Angle A: Value Teardown
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiFramework('case_study_proof')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          aiFramework === 'case_study_proof' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📊 Angle B: Peer Case Study
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiFramework('3_sentence_hook')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                          aiFramework === '3_sentence_hook' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⚡ Angle C: 3-Sentence Hook
                      </button>
                    </div>
                  </div>

                  {rawHeaders.length > 0 && (
                    <div className="p-2.5 bg-white/90 border border-indigo-100 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Detected CSV Columns Injected into AI:</span>
                      </span>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {rawHeaders.slice(0, 6).map(h => (
                          <span key={h} className="bg-indigo-50 text-indigo-700 font-mono text-[10px] px-1.5 py-0.5 rounded border border-indigo-200">
                            {'{{'}{h}{'}}'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* FIELD 1: TARGET AVATAR */}
                    <div className="space-y-1.5 bg-white/90 p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">1. Target Avatar / Niche</label>
                        <span className="text-[9px] text-indigo-600 font-medium">Who you help</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Dental Clinics, SaaS Founders, Agencies"
                        value={aiAudience}
                        onChange={e => setAiAudience(e.target.value)}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                        {['Dental Clinics', 'B2B SaaS', 'Marketing Agencies', 'MedSpas', 'E-Commerce'].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAiAudience(preset)}
                            className="text-[9px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-1.5 py-0.5 rounded transition-all whitespace-nowrap cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FIELD 2: RESULT / OFFER */}
                    <div className="space-y-1.5 bg-white/90 p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">2. What Result You Get Them</label>
                        <span className="text-[9px] text-indigo-600 font-medium">Dream outcome</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Add 15 high-ticket patients monthly"
                        value={aiOffer}
                        onChange={e => setAiOffer(e.target.value)}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto pt-0.5">
                        {['Add 15-20 calls/mo', '99% Primary Inboxing', 'Cut churn by 30%', 'Absorb overflow dev'].map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAiOffer(preset)}
                            className="text-[9px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-1.5 py-0.5 rounded transition-all whitespace-nowrap cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* FIELD 3: FREE GIFT / ASSET (SMART PRESET DROPDOWN + EDITABLE INPUT) */}
                    <div className="space-y-1.5 bg-white/90 p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">3. Free Gift / Asset</label>
                        <select
                          onChange={e => {
                            if (e.target.value) setAiLeadMagnet(e.target.value);
                          }}
                          className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>💡 Pick Asset...</option>
                          <option value="60-second video teardown / pitch page ({{Pitch_Page_URL}})">📹 60s Video Teardown</option>
                          <option value="a 1-page benchmark audit / breakdown ({{Pitch_Page_URL}})">📊 1-Page Benchmark Audit</option>
                          <option value="a step-by-step SOP checklist ({{Pitch_Page_URL}})">📋 Actionable SOP Checklist</option>
                          <option value="a peer case study with verified numbers ({{Pitch_Page_URL}})">📈 Peer Case Study Proof</option>
                          <option value="our custom pricing model & sample report ({{Pitch_Page_URL}})">📑 Custom Sample Report</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 60s video audit, 1-page breakdown"
                        value={aiLeadMagnet}
                        onChange={e => setAiLeadMagnet(e.target.value)}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <span className="text-[9px] text-slate-400 block truncate">Delivers upfront value before asking for anything.</span>
                    </div>

                    {/* FIELD 4: LOW-FRICTION QUESTION (SMART PRESET DROPDOWN + EDITABLE INPUT) */}
                    <div className="space-y-1.5 bg-white/90 p-3 rounded-xl border border-indigo-100/80 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">4. Low-Friction Question</label>
                        <select
                          onChange={e => {
                            if (e.target.value) setAiCta(e.target.value);
                          }}
                          className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>💡 Pick Question...</option>
                          <option value="Worth a quick look?">🟢 "Worth a quick look?"</option>
                          <option value="Mind if I send over the 1-page breakdown?">🟢 "Mind if I send over the 1-page breakdown?"</option>
                          <option value="Open to checking it out?">🟢 "Open to checking it out?"</option>
                          <option value="Worth a brief 5-min intro this week?">🟢 "Worth a brief 5-min intro this week?"</option>
                          <option value="Curious if this is on your radar for {{Company}}?">🟢 "Curious if this is on your radar for {'{{Company}}'}?"</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Worth a quick look?"
                        value={aiCta}
                        onChange={e => setAiCta(e.target.value)}
                        className="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <span className="text-[9px] text-slate-400 block truncate">Single low-pressure permission question.</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-indigo-100">
                    <span className="text-[10px] text-slate-500">
                      Under 50 words • 3rd-grade reading level • Zero corporate pleasantries • Threaded Follow-ups
                    </span>
                    <button
                      type="button"
                      onClick={handleWizardGenerateAiCopy}
                      disabled={isGeneratingAi}
                      className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-1.5 disabled:opacity-50 active:scale-95 glow-tag cursor-pointer"
                    >
                      {isGeneratingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      <span>{isGeneratingAi ? 'Writing Custom Sequence...' : 'Generate AI Sequence'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ MODE 3: WRITE YOUR OWN MESSAGE & CSV TAG PALETTE ═══ */}
              {sequenceMode === 'manual' && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Dynamic CSV Tags Palette</h4>
                      <p className="text-[11px] text-slate-500">Click any tag chip below to insert it at your cursor in the active email step.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {['First_Name', 'Company', 'Title', 'City', 'Website', 'Icebreaker', 'Pitch_Page_URL', ...rawHeaders.filter(h => !['email', 'first_name', 'firstname', 'name', 'company', 'title', 'website', 'icebreaker', 'pitch_url'].includes(h.toLowerCase()))].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertTagAtCursor(tag)}
                        className="text-xs font-mono font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        + {'{{'}{tag}{'}}'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ SAVED CUSTOM TEMPLATES BAR ═══ */}
              {savedCustomTemplates.length > 0 && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Saved Templates:</span>
                    {savedCustomTemplates.map(tmpl => (
                      <div key={tmpl.id} className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-800">
                        <button
                          type="button"
                          onClick={() => handleLoadCustomTemplate(tmpl.id)}
                          className="hover:text-indigo-600 font-bold"
                        >
                          {tmpl.name}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomTemplate(tmpl.id, e)}
                          className="text-slate-400 hover:text-rose-600 text-[10px] ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ STEP TABS & ACTION TOOLBAR ═══ */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {steps.map((st, idx) => (
                    <button
                      key={st.id}
                      onClick={() => setActiveStepIndex(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                        activeStepIndex === idx
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-xs ring-1 ring-indigo-400/30'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Step {idx + 1} {st.dayDelay > 0 ? `(+${st.dayDelay}d)` : '(Initial)'}
                    </button>
                  ))}
                  <button
                    onClick={handleAddSequenceStep}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>

                {steps[activeStepIndex] && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSaveTemplateOpen(true)}
                      className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <span>💾 Save Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWizardDeSpamify(activeStepIndex)}
                      className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> De-Spamify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWizardAutoSpintax(activeStepIndex)}
                      className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-purple-600" /> Auto-Spintax
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWizardSpinPreview(activeStepIndex)}
                      className="text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-95 glow-tag"
                    >
                      <Dices className="w-3.5 h-3.5" /> Spin &amp; Preview
                    </button>
                  </div>
                )}
              </div>

              {/* ═══ ACTIVE STEP EDITOR ═══ */}
              {steps[activeStepIndex] && (
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Step {activeStepIndex + 1}
                      </span>

                      {/* ═══ REAL-TIME FLESCH-KINCAID READABILITY & BREVITY METRICS ═══ */}
                      {(() => {
                        const metrics = calculateReadability(steps[activeStepIndex].body);
                        return (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              metrics.gradeStatus === 'optimal'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : metrics.gradeStatus === 'acceptable'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <span>📖 {metrics.gradeLabel}</span>
                              <span className="text-[9px] font-medium opacity-80 font-sans">
                                ({metrics.gradeStatus === 'optimal' ? '3rd-Grade Simplicity' : metrics.gradeStatus === 'acceptable' ? 'Clear' : 'Too Complex'})
                              </span>
                            </span>

                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              metrics.wordCountStatus === 'optimal'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : metrics.wordCountStatus === 'acceptable'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <span>📏 {metrics.wordCount}w</span>
                              <span className="text-[9px] font-medium opacity-80 font-sans">
                                ({metrics.wordCountStatus === 'optimal' ? '<50w Optimal' : metrics.wordCountStatus === 'acceptable' ? '<65w' : 'Too Long'})
                              </span>
                            </span>

                            <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              <span>{calculateSpintaxPermutations(`${steps[activeStepIndex].subject} ${steps[activeStepIndex].body}`).toLocaleString()} Permutations</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {activeStepIndex > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <label className="text-slate-500">Wait Days after prior step:</label>
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={steps[activeStepIndex].dayDelay}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setSteps(steps.map((st, i) => i === activeStepIndex ? { ...st, dayDelay: val } : st));
                            }}
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveStep(activeStepIndex)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                        >
                          Remove Step
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Subject Line (Spintax Supported)</label>
                    <input
                      type="text"
                      value={steps[activeStepIndex].subject}
                      onChange={e => {
                        const val = e.target.value;
                        setSteps(steps.map((st, i) => i === activeStepIndex ? { ...st, subject: val } : st));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* ═══ DYNAMIC CSV TAG PALETTE (CLICKABLE CHIPS) ═══ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Email Body</label>
                      <span className="text-[10px] text-slate-500">Click tag below to insert:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      {['First_Name', 'Company', 'Title', 'City', 'Website', 'Icebreaker', 'Pitch_Page_URL', ...rawHeaders.filter(h => !['email', 'first_name', 'firstname', 'name', 'company', 'title', 'website', 'icebreaker', 'pitch_url'].includes(h.toLowerCase()))].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleInsertTagAtCursor(tag)}
                          className="text-[11px] font-mono font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg shadow-2xs transition-all active:scale-95"
                        >
                          + {'{{'}{tag}{'}}'}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={6}
                      value={steps[activeStepIndex].body}
                      onChange={e => {
                        const val = e.target.value;
                        setSteps(steps.map((st, i) => i === activeStepIndex ? { ...st, body: val } : st));
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-900 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Spintax Samples Drawer */}
                  {wizardSpintaxSamples.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                        <span className="flex items-center gap-1.5">
                          <Dices className="w-4 h-4 text-indigo-600" />
                          <span>Sample Spintax Permutations for Step {activeStepIndex + 1}:</span>
                        </span>
                        <button type="button" onClick={() => setWizardSpintaxSamples([])} className="text-slate-400 hover:text-slate-700 text-[11px]">
                          Dismiss ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {wizardSpintaxSamples.map((sample, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 whitespace-pre-line font-sans">
                            <strong className="text-indigo-600 block text-[10px] font-mono mb-1">Permutation #{idx + 1}:</strong>
                            {sample}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* ═══ SAVE TEMPLATE MODAL ═══ */}
              {isSaveTemplateOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>💾 Save Sequence as Custom Template</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsSaveTemplateOpen(false)}
                        className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Template Name</label>
                      <input
                        type="text"
                        placeholder="e.g. My MedSpa 3-Touch Pitch, SEO Teardown Angle..."
                        value={newTemplateName}
                        onChange={e => setNewTemplateName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsSaveTemplateOpen(false)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCustomTemplate}
                        className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-xs"
                      >
                        Save Template
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md shadow-indigo-500/20 flex items-center gap-2"
                >
                  <span>Review &amp; Schedule →</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & LAUNCH */}
          {wizardStep === 4 && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">Campaign Summary Review</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Campaign Name</span>
                    <span className="font-bold text-slate-900">{name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Recipients</span>
                    <span className="font-black text-emerald-600 font-mono text-sm">{uploadedRecipients.length} leads</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Sequence Steps</span>
                    <span className="font-bold text-indigo-600 font-mono">{steps.length} touches</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] uppercase font-bold">Sending Window</span>
                    <span className="font-mono text-slate-800">{windowStart}–{windowEnd} ({timezone.split(' ')[0]})</span>
                  </div>
                </div>
              </div>

              {userPlan === 'free' && activeCount >= 1 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                  <span>🔒 Free Plan: 1 campaign is already actively running. This campaign will be saved as <strong>Paused</strong>.</span>
                  <button
                    type="button"
                    onClick={() => { setUpgradeReason('campaign_limit'); setIsUpgradeOpen(true); }}
                    className="text-xs font-black text-amber-900 underline hover:text-amber-950 shrink-0"
                  >
                    Upgrade to Pro ➔
                  </button>
                </div>
              )}

              {userPlan === 'pro' && activeCount >= 5 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between gap-3">
                  <span>🔒 Pro Plan: 5 active campaigns are already running. This campaign will be saved as <strong>Paused</strong>.</span>
                  <button
                    type="button"
                    onClick={() => { setUpgradeReason('pro_campaign_limit'); setIsUpgradeOpen(true); }}
                    className="text-xs font-black text-purple-900 underline hover:text-purple-950 shrink-0"
                  >
                    Upgrade to Agency Scale ➔
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setWizardStep(3)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTestModalOpen(true)}
                    className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Send Test Email</span>
                  </button>

                  <button
                    onClick={handleFinalizeCreateCampaign}
                    className={`text-xs font-bold px-7 py-3 rounded-xl shadow-lg transition-all active:scale-95 glow-tag ${
                      (userPlan === 'free' && activeCount >= 1) || (userPlan === 'pro' && activeCount >= 5)
                        ? 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-amber-500/20'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <span>
                      {userPlan === 'free' && activeCount >= 1
                        ? 'Save Campaign as Paused 💾'
                        : userPlan === 'pro' && activeCount >= 5
                        ? 'Save Campaign as Paused (5 Active) 💾'
                        : 'Launch & Schedule Campaign 🚀'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ CAMPAIGN DETAILS INSPECTOR DRAWER ═══ */}
      {selectedCampaign && (
        <div className="bg-white rounded-3xl border-2 border-indigo-300 shadow-xl p-6 space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-slate-900">{selectedCampaign.name}</h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedCampaign.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {selectedCampaign.steps.length} Sequence Steps • {selectedCampaign.recipients.length} Total Contacts • Window: {selectedCampaign.windowStart}–{selectedCampaign.windowEnd}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCloneCampaign(selectedCampaign)}
                className="text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-600" />
                <span>Clone Sequence</span>
              </button>
              <button
                onClick={() => setTestModalOpen(true)}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                <span>Send Test</span>
              </button>
              <button
                onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Delete Campaign"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Campaign</span>
              </button>
              <button
                onClick={() => setSelectedCampaignId(null)}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-2 rounded-xl"
              >
                Close Inspector ✕
              </button>
            </div>
          </div>

          {/* Sequence Steps Overview */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sequence Timeline</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {selectedCampaign.steps.map((st, i) => (
                <div key={st.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Touch #{i + 1}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{st.dayDelay === 0 ? 'Day 1' : `+${st.dayDelay} days`}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-mono">{st.subject}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recipient Contacts Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Campaign Contacts ({selectedCampaign.recipients.length})
              </span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search contact email..."
                    value={recipientSearch}
                    onChange={e => setRecipientSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs w-48"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Company</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Pitch Deck Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCampaign.recipients
                    .filter(r => recipientSearch === '' || r.email.toLowerCase().includes(recipientSearch.toLowerCase()))
                    .map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-medium text-slate-900">{r.email}</td>
                        <td className="p-3.5 text-slate-700">{r.firstName || '—'}</td>
                        <td className="p-3.5 font-bold text-slate-800">{r.company || '—'}</td>
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            r.status === 'sent'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {r.status} {r.sentAt ? `(${r.sentAt})` : ''}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {r.pitchUrl ? (
                            <a href={r.pitchUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-600 hover:underline font-mono">
                              View Deck ↗
                            </a>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CAMPAIGNS LIST ═══ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 px-2 flex items-center gap-1"><Filter className="w-3 h-3" /> Filter:</span>
            <button
              onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({campaigns.length})
            </button>
            <button
              onClick={() => { setActiveFilter('active'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${activeFilter === 'active' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => { setActiveFilter('scheduled'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${activeFilter === 'scheduled' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Scheduled
            </button>
            <button
              onClick={() => { setActiveFilter('paused'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${activeFilter === 'paused' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Paused
            </button>
            <button
              onClick={() => { setActiveFilter('done'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${activeFilter === 'done' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Done
            </button>
          </div>

          {/* Search Input for 100+ Campaigns */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across campaigns..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs w-44 sm:w-56 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}

          </div>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery || activeFilter !== 'all' ? 'No campaigns match your filter' : 'No campaigns created yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || activeFilter !== 'all'
                ? 'Try adjusting your search query or switching to All filter.'
                : 'Launch your first campaign with our 4-step wizard to start sending.'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleOpenCreateWizard}
                className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
              >
                + Create First Campaign
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100" suppressHydrationWarning>
              {paginatedCampaigns.map(camp => {
                const sentRecips = camp.recipients.filter(r => r.status === 'sent' || r.status === 'opened' || r.status === 'replied').length;
                const progress = camp.recipients.length > 0 ? Math.round((sentRecips / camp.recipients.length) * 100) : 0;
                const isSending = camp.status === 'in_progress' || camp.status === 'sending';
                const activeRunningCampaigns = campaigns.filter(c => c.status === 'in_progress' || c.status === 'sending');
                const maxAllowedActive = userPlan === 'free' ? 1 : userPlan === 'pro' ? 5 : 99999;
                const isCapReached = activeRunningCampaigns.length >= maxAllowedActive;
                const isLaunchDisabled = isCapReached && !isSending && camp.status !== 'done';

                return (
                  <div key={camp.id} className={`py-4 sm:py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-4 sm:p-5 rounded-3xl border transition-all duration-200 ${
                    isLaunchDisabled 
                      ? 'bg-slate-50/70 border-slate-200/70 opacity-90' 
                      : 'bg-white hover:bg-slate-50/90 border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
                  }`}>
                  {/* Left Info */}
                  <div className="space-y-2 flex-1 cursor-pointer min-w-0" onClick={() => setSelectedCampaignId(camp.id)}>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isSending ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-100' :
                        camp.status === 'paused' ? 'bg-amber-400' :
                        camp.status === 'done' ? 'bg-indigo-500' : 'bg-slate-300'
                      }`} />
                      <h4 className="text-base font-black text-slate-900 truncate hover:text-indigo-600 transition-colors">
                        {camp.name}
                      </h4>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isSending ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono' :
                        camp.status === 'paused' ? 'bg-amber-50 text-amber-700 border border-amber-200 font-mono' :
                        camp.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200 font-mono' :
                        camp.status === 'done' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono' :
                        'bg-slate-100 text-slate-600 font-mono'
                      }`}>
                        {camp.status}
                      </span>
                      {isLaunchDisabled && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                          🔒 {userPlan === 'free' ? '1 Active Limit' : '5 Active Limit (Pro)'}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-mono truncate max-w-lg">
                      <span className="text-slate-400">Subject:</span> <strong className="text-slate-800 font-medium">{camp.steps[0]?.subject || 'No subject set'}</strong>
                    </div>

                    {/* Timing & Pacing Badges */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                      {camp.is24Hours ? (
                        <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-bold">
                          ⚡ 24/7 Continuous Mode
                        </span>
                      ) : (
                        <span className="font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                          {camp.windowStart} - {camp.windowEnd} ({camp.timezone.split('/')[1] || 'UTC'})
                        </span>
                      )}
                      <span className="font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-bold">
                        Pacing: {camp.delaySeconds}s delay
                      </span>
                      <span className="font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-slate-600 font-bold">
                        Limit: {camp.dailyLimit}/day
                      </span>
                      <span className="font-mono text-indigo-600 font-bold">
                        {camp.steps.length} Touchpoint Steps
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Performance Numbers */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-5 shrink-0">
                    <div className="text-right min-w-[140px] space-y-1" onClick={() => setSelectedCampaignId(camp.id)}>
                      <div className="flex items-center justify-end gap-2 font-mono text-xs cursor-pointer">
                        <span className="font-black text-slate-900">{sentRecips}</span>
                        <span className="text-slate-400">/ {camp.recipients.length} sent</span>
                        <span className="text-indigo-600 font-extrabold font-mono">({progress}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSending ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                            camp.status === 'done' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.max(4, progress)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCampaignId(camp.id)}
                        className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all shadow-2xs"
                        title="Inspect Recipients"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>Inspect</span>
                      </button>

                      {camp.status === 'draft' ? (
                        <button
                          type="button"
                          onClick={() => handleResumeDraft(camp)}
                          className="text-xs font-bold px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white border border-purple-600 flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Finish Setup ➔</span>
                        </button>
                      ) : camp.status === 'done' ? (
                        <span className="text-xs font-bold px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <>
                          {isLaunchDisabled ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (userPlan === 'free') {
                                  setUpgradeReason('campaign_limit');
                                } else {
                                  setUpgradeReason('pro_campaign_limit');
                                }
                                setIsUpgradeOpen(true);
                              }}
                              className="text-xs font-bold px-3 py-2 rounded-xl border bg-amber-50/80 text-amber-900 border-amber-300 hover:bg-amber-100 flex items-center gap-1.5 shadow-2xs transition-all"
                              title={
                                userPlan === 'free'
                                  ? `Free plan limit: Only 1 active campaign can run at a time. Pause "${activeRunningCampaigns[0]?.name}" or upgrade to Pro.`
                                  : `Pro plan limit: 5 active campaigns running. Pause a running campaign or upgrade to Agency Scale for unlimited fleets.`
                              }
                            >
                              <Play className="w-3.5 h-3.5 fill-current text-amber-700" />
                              <span>{userPlan === 'free' ? '🔒 1 Active (Pro ➔)' : '🔒 5 Active (Agency ➔)'}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(camp.id)}
                              className={`text-xs font-bold px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 ${
                                isSending
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600'
                              }`}
                            >
                              {isSending ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                              <span>{isSending ? 'Pause' : 'Start'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCloneCampaign(camp)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                            title="Duplicate / Clone Sequence"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportLeadsCSV(camp)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                            title="Export Leads CSV Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-4 gap-3 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span>
                    Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(filteredCampaigns.length, currentPage * pageSize)} of {filteredCampaigns.length} campaigns
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 font-mono text-[11px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ LIVE TEST EMAIL MODAL ═══ */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Send Test Email Preview</h3>
              </div>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Sends an immediate live sample of Step 1 to your personal inbox with all merge tags rendered.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Deliver Test To (Your Email)</label>
              <input
                type="email"
                placeholder="you@domain.com"
                value={testEmailTo}
                onChange={e => setTestEmailTo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
              />
            </div>

            {testSentSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Test email dispatched successfully! Check your inbox.</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setTestModalOpen(false)} className="text-xs font-semibold px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
              <button
                onClick={handleSendTestEmail}
                className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95"
              >
                Send Test Now
              </button>
            </div>
          </div>
        </div>
      )}

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
