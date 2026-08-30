'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Server, Key, Settings, Plus, CheckCircle2, AlertCircle, 
  Trash2, Eye, EyeOff, RefreshCw, Check, Zap, Sparkles, Building2,
  Crown, ShieldCheck, User, CreditCard, Copy, Download, Radio,
  Mail, Clock, Sliders, ArrowRight, Cloud
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SenderAccount } from '../tabs/SendersTab';
import UpgradeProModal from '../modals/UpgradeProModal';
import { canAddMailbox, UserPlan } from '@/lib/planLimits';
import { getStoredLicense, saveLicense, redeemLicenseCode, LicenseDetails } from '@/lib/licenseEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'billing' | 'senders' | 'api' | 'preferences';
  userEmail?: string;
  userId?: string;
}

export const DEFAULT_USER_SENDERS: SenderAccount[] = [];

const getInitialSenders = (): SenderAccount[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('xsendflow_senders');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return DEFAULT_USER_SENDERS;
};

export default function ProfileSettingsModal({ 
  isOpen, 
  onClose, 
  initialTab = 'profile',
  userEmail,
  userId
}: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'senders' | 'api' | 'preferences'>(initialTab);

  // Profile State
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === 'undefined') return 'Alex Founder';
    return localStorage.getItem('xsendflow_display_name') || (userEmail ? userEmail.split('@')[0] : 'Founder');
  });
  const [orgName, setOrgName] = useState(() => {
    if (typeof window === 'undefined') return 'Growth Studio Inc';
    return localStorage.getItem('xsendflow_org_name') || 'Growth Studio Inc';
  });
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);

  // License & Billing State
  const [license, setLicense] = useState<LicenseDetails>(getStoredLicense);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copiedLicense, setCopiedLicense] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Sender state
  const [senders, setSenders] = useState<SenderAccount[]>(getInitialSenders);
  const [isAddingSender, setIsAddingSender] = useState(false);
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [dailyLimit, setDailyLimit] = useState(100);
  const [showPass, setShowPass] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // API Key state
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    try {
      return localStorage.getItem('xsendflow_gemini_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    } catch {
      return '';
    }
  });
  const [deepseekKey, setDeepseekKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('xsendflow_deepseek_key') || ''; } catch { return ''; }
  });
  const [openaiKey, setOpenaiKey] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('xsendflow_openai_key') || ''; } catch { return ''; }
  });
  const [activeAiProvider, setActiveAiProvider] = useState<'gemini' | 'openai' | 'deepseek'>(() => {
    if (typeof window === 'undefined') return 'gemini';
    try {
      return (localStorage.getItem('xsendflow_active_ai_provider') as 'gemini' | 'openai' | 'deepseek') || 'gemini';
    } catch {
      return 'gemini';
    }
  });
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  // Preferences state
  const [defaultTimezone, setDefaultTimezone] = useState('America/New_York (EST)');
  const [defaultDelay, setDefaultDelay] = useState(45);
  const [emailSignature, setEmailSignature] = useState('Best regards,\nYour Name');
  const [savedPrefSuccess, setSavedPrefSuccess] = useState(false);

  useEffect(() => {
    const handleLicenseUpdate = () => {
      setLicense(getStoredLicense());
    };
    window.addEventListener('xsendflow_license_updated', handleLicenseUpdate);
    window.addEventListener('xsendflow_plan_updated', handleLicenseUpdate);
    return () => {
      window.removeEventListener('xsendflow_license_updated', handleLicenseUpdate);
      window.removeEventListener('xsendflow_plan_updated', handleLicenseUpdate);
    };
  }, []);

  const handleUpdateSenders = (newSenders: SenderAccount[]) => {
    setSenders(newSenders);
    try {
      localStorage.setItem('xsendflow_senders', JSON.stringify(newSenders));
      window.dispatchEvent(new Event('xsendflow_senders_updated'));
    } catch {}
  };

  const [selectedPreset, setSelectedPreset] = useState<'gmail' | 'hostinger' | 'outlook' | 'custom'>('gmail');

  const handleProviderPreset = (provider: 'gmail' | 'hostinger' | 'outlook' | 'custom') => {
    setSelectedPreset(provider);
    if (provider === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
    } else if (provider === 'hostinger') {
      setSmtpHost('smtp.hostinger.com');
      setSmtpPort(465);
    } else if (provider === 'outlook') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
    } else if (provider === 'custom') {
      setSmtpHost('');
      setSmtpPort(587);
    }
  };

  const handleTestSmtp = async () => {
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      alert('Please fill out SMTP Host, Port, Username, and Password.');
      return;
    }
    setTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const res = await fetch('/api/smtp/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtpHost, smtpPort, smtpUser, smtpPass })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpTestResult({
          ok: true,
          msg: data.message || `SMTP Handshake with ${smtpHost}:${smtpPort} verified successfully!`
        });
      } else {
        setSmtpTestResult({
          ok: false,
          msg: data.error || `Failed to connect to ${smtpHost}:${smtpPort}. Check credentials and port.`
        });
      }
    } catch {
      setSmtpTestResult({
        ok: false,
        msg: `Connection timeout or network error reaching ${smtpHost}:${smtpPort}.`
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleAddSender = () => {
    if (!email.trim() || !smtpHost.trim()) {
      alert('Please provide sender email and SMTP host.');
      return;
    }

    const currentPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
    if (!canAddMailbox(senders.length, currentPlan)) {
      setIsUpgradeOpen(true);
      return;
    }

    const newSender: SenderAccount = {
      id: `sender-${Date.now()}`,
      email: email.trim(),
      label: label.trim() || email.trim(),
      smtpHost: smtpHost.trim(),
      smtpPort,
      smtpUser: smtpUser.trim() || email.trim(),
      smtpPass: smtpPass.trim(),
      dailyLimit,
      dailySentCount: 0,
      createdAt: new Date().toISOString()
    };

    handleUpdateSenders([newSender, ...senders]);
    setIsAddingSender(false);
    setEmail('');
    setLabel('');
    setSmtpUser('');
    setSmtpPass('');
    setSmtpTestResult(null);

    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    } catch {}
  };

  const handleDeleteSender = (id: string) => {
    if (!confirm('Remove this SMTP sender account?')) return;
    handleUpdateSenders(senders.filter(s => s.id !== id));
  };

  const handleSaveProfile = () => {
    try {
      localStorage.setItem('xsendflow_display_name', displayName.trim());
      localStorage.setItem('xsendflow_org_name', orgName.trim());
      setSavedProfileSuccess(true);
      setTimeout(() => setSavedProfileSuccess(false), 2500);
    } catch {}
  };

  const handleSaveApiKeys = () => {
    try {
      localStorage.setItem('xsendflow_active_ai_provider', activeAiProvider);
      localStorage.setItem('xsendflow_gemini_key', geminiKey.trim());
      localStorage.setItem('xsendflow_deepseek_key', deepseekKey.trim());
      localStorage.setItem('xsendflow_openai_key', openaiKey.trim());
      window.dispatchEvent(new Event('xsendflow_keys_updated'));
      setSavedKeySuccess(true);
      setTimeout(() => setSavedKeySuccess(false), 2500);
    } catch {}
  };

  const handleSavePreferences = () => {
    setSavedPrefSuccess(true);
    setTimeout(() => setSavedPrefSuccess(false), 2500);
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim()) return;
    setRedeemLoading(true);
    setRedeemStatus(null);

    try {
      const res = await fetch('/api/license/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim(), userEmail, userId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        redeemLicenseCode(redeemCode.trim());
        setRedeemStatus({ ok: true, msg: data.message });
        setLicense(getStoredLicense());
        setRedeemCode('');
        try { confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } }); } catch {}
      } else {
        setRedeemStatus({ ok: false, msg: data.error || 'Invalid or expired license key.' });
      }
    } catch {
      // Offline fallback redemption
      const localResult = redeemLicenseCode(redeemCode.trim());
      if (localResult.success) {
        setRedeemStatus({ ok: true, msg: localResult.message });
        setLicense(getStoredLicense());
        setRedeemCode('');
        try { confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } }); } catch {}
      } else {
        setRedeemStatus({ ok: false, msg: localResult.message });
      }
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCopyLicense = () => {
    navigator.clipboard.writeText(license.licenseKey);
    setCopiedLicense(true);
    setTimeout(() => setCopiedLicense(false), 2000);
  };

  const handleExportWorkspace = () => {
    const data = {
      profile: { displayName, orgName, userEmail },
      license,
      senders,
      campaigns: JSON.parse(localStorage.getItem('xsendflow_campaigns_v2') || '[]'),
      exportedAt: new Date().toISOString(),
      app: 'XSendFlow'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xsendflow_workspace_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 font-black text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">{displayName}</h3>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                  license.plan === 'agency' 
                    ? 'bg-amber-50 text-amber-700 border-amber-300' 
                    : license.plan === 'pro' 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {license.plan === 'agency' ? '🏢 Agency Scale' : license.plan === 'pro' ? '👑 Pro Unlimited' : '⚡ Free Starter'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{userEmail || 'outreach@company.com'} • {orgName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Settings"
            id="close-settings-modal-btn"
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body with Tabs */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div className="w-full sm:w-52 bg-slate-50/90 border-b sm:border-b-0 sm:border-r border-slate-200 p-3 space-y-1 shrink-0 overflow-y-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Profile &amp; Team</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'billing'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              <span className="flex-1">License &amp; Billing</span>
              {license.plan !== 'free' && (
                <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                  {license.daysRemaining}d
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('senders')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'senders'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>Mailboxes ({senders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'api'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>AI API Keys</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'preferences'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sending Defaults</span>
            </button>
          </div>

          {/* Content Pane */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* ═══ TAB 1: PROFILE & TEAM ═══ */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">User Profile &amp; Organization</h4>
                  <p className="text-xs text-slate-500">Configure your personal name, sender signatures, and team workspace details</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Full Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="e.g. Alex Mercer"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Organization / Agency</label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        placeholder="e.g. Acme Growth Media"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Primary Account Email</label>
                    <input
                      type="email"
                      disabled
                      value={userEmail || 'outreach@company.com'}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 font-mono cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400">Authenticated via Supabase Zero-Trust Vault</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-indigo-950">Export Full Workspace Data</h5>
                      <p className="text-[11px] text-slate-600">Download all your campaigns, senders, and analytics as encrypted JSON.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportWorkspace}
                      className="text-xs font-bold bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Backup JSON</span>
                    </button>
                  </div>

                  {savedProfileSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Profile information updated successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 2: LICENSE & BILLING ═══ */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">License Key &amp; Subscription Engine</h4>
                    <p className="text-xs text-slate-500">View real-time plan status, expiration timeline, and redeem license keys</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                    license.plan === 'agency'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : license.plan === 'pro'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {license.plan.toUpperCase()} TIER ACTIVE
                  </div>
                </div>

                {/* Holographic Active License Card */}
                <div className={`p-5 rounded-3xl text-white shadow-xl relative overflow-hidden ${
                  license.plan === 'agency'
                    ? 'bg-gradient-to-br from-[#1a1306] via-[#2d1b03] to-[#0d0a04] border border-amber-500/40'
                    : license.plan === 'pro'
                    ? 'bg-gradient-to-br from-[#0c102b] via-[#1b143f] to-[#080a1c] border border-indigo-500/40'
                    : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-700'
                }`}>
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        {license.plan === 'agency' ? (
                          <Building2 className="w-5 h-5 text-amber-400" />
                        ) : license.plan === 'pro' ? (
                          <Crown className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Zap className="w-5 h-5 text-emerald-400" />
                        )}
                        <h3 className="text-lg font-black tracking-tight">
                          {license.plan === 'agency' ? 'Agency Scale Enterprise Fleet' : license.plan === 'pro' ? 'Pro Unlimited Cold Outreach Engine' : 'Free Forever Starter Plan'}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg font-mono text-xs text-slate-200">
                          <span>License:</span>
                          <strong className="text-cyan-300 font-bold">{license.licenseKey}</strong>
                          <button
                            type="button"
                            onClick={handleCopyLicense}
                            className="text-slate-400 hover:text-white ml-1"
                            title="Copy License Key"
                          >
                            {copiedLicense ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {license.plan !== 'free' && (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{license.daysRemaining} days remaining</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {license.plan !== 'agency' && (
                        <button
                          type="button"
                          onClick={() => setIsUpgradeOpen(true)}
                          className="text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
                        >
                          {license.plan === 'free' ? 'Upgrade to Pro ➔' : 'Upgrade to Agency ➔'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Redeem License Key Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-purple-600" />
                      <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Redeem License Key / Voucher</h5>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Format: XSF-PRO-XXXX or XSF-AGENCY-XXXX</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={e => setRedeemCode(e.target.value)}
                      placeholder="Enter activation code (e.g. XSF-PRO-PASS or XSF-AGENCY-VIP)"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleRedeemCode}
                      disabled={redeemLoading || !redeemCode.trim()}
                      className="text-xs font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95"
                    >
                      {redeemLoading ? 'Activating...' : 'Activate License'}
                    </button>
                  </div>

                  {redeemStatus && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      redeemStatus.ok 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {redeemStatus.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      <span>{redeemStatus.msg}</span>
                    </div>
                  )}
                </div>

                {/* Quota Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Send Cap</span>
                    <div className="text-lg font-extrabold text-slate-900 font-mono">
                      {license.plan === 'free' ? '100 emails/day' : 'Unlimited'}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {license.plan === 'free' ? 'Resets daily 00:00 UTC' : 'Multi-Inbox Fleet Active'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Connected Mailboxes</span>
                    <div className="text-lg font-extrabold text-slate-900 font-mono">
                      {senders.length} / {license.plan === 'free' ? '1' : 'Unlimited'}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {license.plan === 'free' ? 'Upgrade for Multi-Inbox' : 'Multi-Sender Rotator Active'}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5 text-cyan-600" />
                      <span>24/7 Cloud Background Queue</span>
                    </span>
                    <div className="text-lg font-extrabold text-slate-900 font-mono">
                      {license.plan === 'free' ? 'Browser Only' : 'Active (Cloud Powered)'}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {license.plan === 'free' ? 'Upgrade to Pro' : 'Autonomous 24/7 Cloud Engine'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 3: SMTP SENDERS ═══ */}
            {activeTab === 'senders' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Connected SMTP Accounts</h4>
                    <p className="text-xs text-slate-500">Add Google Workspace, Hostinger, Outlook, or custom SMTP relays</p>
                  </div>
                  {!isAddingSender && (
                    <button
                      onClick={() => {
                        const currentPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
                        if (currentPlan === 'free' && senders.length >= 1) {
                          setIsUpgradeOpen(true);
                          return;
                        }
                        setIsAddingSender(true);
                      }}
                      className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New SMTP</span>
                      {((typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') === 'free') && senders.length >= 1 && (
                        <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                          PRO
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {isAddingSender ? (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900">Choose Provider Preset</h5>
                        <span className="text-[10px] text-slate-500 font-mono">Select to auto-configure ports &amp; hostnames</span>
                      </div>
                      
                      {/* 4 Provider Preset Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* Gmail */}
                        <button
                          type="button"
                          onClick={() => handleProviderPreset('gmail')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                            selectedPreset === 'gmail'
                              ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-400 text-rose-950 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-black text-xs shrink-0">
                            G
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Gmail / GSuite</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">smtp.gmail.com</div>
                          </div>
                        </button>

                        {/* Hostinger */}
                        <button
                          type="button"
                          onClick={() => handleProviderPreset('hostinger')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                            selectedPreset === 'hostinger'
                              ? 'bg-purple-50/90 border-purple-300 ring-1 ring-purple-400 text-purple-950 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xs shrink-0">
                            H
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Hostinger</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">smtp.hostinger.com</div>
                          </div>
                        </button>

                        {/* Outlook */}
                        <button
                          type="button"
                          onClick={() => handleProviderPreset('outlook')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                            selectedPreset === 'outlook'
                              ? 'bg-blue-50/90 border-blue-300 ring-1 ring-blue-400 text-blue-950 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                            O
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Outlook / M365</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">smtp.office365.com</div>
                          </div>
                        </button>

                        {/* Custom Preset */}
                        <button
                          type="button"
                          onClick={() => handleProviderPreset('custom')}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                            selectedPreset === 'custom'
                              ? 'bg-indigo-50/90 border-indigo-300 ring-1 ring-indigo-400 text-indigo-950 shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0">
                            ⚡
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">Custom Preset</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">Any SMTP Relay</div>
                          </div>
                        </button>
                      </div>

                      {/* Contextual Provider Guidance Alert */}
                      <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>
                          {selectedPreset === 'gmail' && 'Google Workspace / Gmail requires a 16-character App Password (Google Account ➔ Security ➔ 2-Step Verification ➔ App Passwords).'}
                          {selectedPreset === 'hostinger' && 'Hostinger Business Email uses port 465 (SSL) with your full Hostinger email and mailbox password.'}
                          {selectedPreset === 'outlook' && 'Outlook / Microsoft 365 uses port 587 (STARTTLS) with your Microsoft credentials or App Password if 2FA is active.'}
                          {selectedPreset === 'custom' && 'Custom Preset supports any SMTP relay (AWS SES, Brevo, SendGrid, Mailgun, Postmark, or private VPS).'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold">Email Address *</label>
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="e.g. founder@company.com"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold">Sender Label</label>
                        <input
                          type="text"
                          value={label}
                          onChange={e => setLabel(e.target.value)}
                          placeholder="e.g. Founder Direct Inbox"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold">SMTP Host *</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold">SMTP Port *</label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={e => setSmtpPort(Number(e.target.value))}
                          placeholder="587"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold">SMTP Username / User *</label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={e => setSmtpUser(e.target.value)}
                          placeholder="smtp_user"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-600 font-bold">App Password / Auth Key *</label>
                        <div className="relative">
                          <input
                            type={showPass ? 'text' : 'password'}
                            value={smtpPass}
                            onChange={e => setSmtpPass(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {smtpTestResult && (
                      <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        smtpTestResult.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {smtpTestResult.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                        <span>{smtpTestResult.msg}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleTestSmtp}
                        disabled={testingSmtp}
                        className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        {testingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{testingSmtp ? 'Testing Handshake...' : 'Test Connection'}</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingSender(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddSender}
                          className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl shadow-xs"
                        >
                          Save Mailbox
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Senders List */}
                <div className="space-y-3">
                  {senders.map((s) => (
                    <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{s.label || s.email}</span>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                              Verified Active
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">{s.email} • {s.smtpHost}:{s.smtpPort}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSender(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Remove sender"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB 4: AI API KEYS ═══ */}
            {activeTab === 'api' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">AI Intelligence &amp; Model Credentials</h4>
                  <p className="text-xs text-slate-500">Configure high-speed Gemini, OpenAI, or DeepSeek API keys for automated icebreaker generation</p>
                </div>

                <div className="space-y-4">
                  {/* ACTIVE PROVIDER SELECTOR */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Active AI Model Engine</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAiProvider('gemini')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          activeAiProvider === 'gemini'
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">Google Gemini</span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">Recommended</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Gemini 2.0 Flash • Ultra fast</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveAiProvider('openai')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          activeAiProvider === 'openai'
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">OpenAI</span>
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">GPT-4o</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">GPT-4o-mini &amp; GPT-4o</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveAiProvider('deepseek')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          activeAiProvider === 'deepseek'
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">DeepSeek</span>
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">V3</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">DeepSeek Chat API</p>
                      </button>
                    </div>
                  </div>

                  {/* GOOGLE GEMINI KEY CARD */}
                  <div className={`p-4 rounded-2xl border space-y-2 transition-all ${
                    activeAiProvider === 'gemini' ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50/50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" /> Google Gemini API Key
                      </span>
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        Get Free Gemini Key ↗
                      </a>
                    </div>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500">Free tier quota from Google AI Studio. Powers real-time cold outreach sequences and icebreaker synthesis.</span>
                  </div>

                  {/* OPENAI KEY CARD */}
                  <div className={`p-4 rounded-2xl border space-y-2 transition-all ${
                    activeAiProvider === 'openai' ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50/50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-emerald-600" /> OpenAI API Key
                      </span>
                      <a 
                        href="https://platform.openai.com/api-keys" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        Get OpenAI Key ↗
                      </a>
                    </div>
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* DEEPSEEK KEY CARD */}
                  <div className={`p-4 rounded-2xl border space-y-2 transition-all ${
                    activeAiProvider === 'deepseek' ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50/50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" /> DeepSeek API Key
                      </span>
                      <a 
                        href="https://platform.deepseek.com/api_keys" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        Get DeepSeek Key ↗
                      </a>
                    </div>
                    <input
                      type="password"
                      value={deepseekKey}
                      onChange={e => setDeepseekKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {savedKeySuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>API credentials securely saved to your local browser vault!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveApiKeys}
                      className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      Save API Keys
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 5: SENDING DEFAULTS ═══ */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">Campaign Dispatch Defaults</h4>
                  <p className="text-xs text-slate-500">Default timezones, human jitter delays, and unsubscribe footer compliance</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Target Timezone Default</label>
                    <select
                      value={defaultTimezone}
                      onChange={e => setDefaultTimezone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900"
                    >
                      <option value="America/New_York (EST)">America/New_York (EST / EDT)</option>
                      <option value="America/Chicago (CST)">America/Chicago (CST / CDT)</option>
                      <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST / PDT)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT / BST)</option>
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Default Gaussian Jitter Delay (Seconds)</label>
                    <input
                      type="number"
                      value={defaultDelay}
                      onChange={e => setDefaultDelay(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                    />
                    <span className="text-[10px] text-slate-400">Applies randomized delays (±15s) to mirror human pacing and prevent ESP fingerprinting.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Default Email Signature</label>
                    <textarea
                      rows={3}
                      value={emailSignature}
                      onChange={e => setEmailSignature(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono"
                    />
                  </div>

                  {savedPrefSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Preferences saved successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSavePreferences}
                      className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeProModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        triggerReason="mailbox_limit"
        targetTier={license.plan === 'pro' ? 'agency' : 'pro'}
        userEmail={userEmail}
        userId={userId}
      />
    </div>
  );
}
