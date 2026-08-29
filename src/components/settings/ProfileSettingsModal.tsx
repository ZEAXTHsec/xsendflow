'use client';

import React, { useState } from 'react';
import { 
  X, Server, Key, Settings, Plus, CheckCircle2, AlertCircle, 
  Trash2, Eye, EyeOff, RefreshCw, Check, Zap, Sparkles, Building2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SenderAccount } from '../tabs/SendersTab';
import UpgradeProModal from '../modals/UpgradeProModal';
import { canAddMailbox, UserPlan } from '@/lib/planLimits';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'senders' | 'api' | 'preferences' | 'billing';
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

export default function ProfileSettingsModal({ isOpen, onClose, initialTab = 'senders' }: Props) {
  const [activeTab, setActiveTab] = useState<'senders' | 'api' | 'preferences' | 'billing'>(initialTab);

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
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  // Preferences state
  const [defaultTimezone, setDefaultTimezone] = useState('America/New_York (EST)');
  const [defaultDelay, setDefaultDelay] = useState(45);
  const [emailSignature, setEmailSignature] = useState('Best regards,\nYour Name');
  const [savedPrefSuccess, setSavedPrefSuccess] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const handleUpdateSenders = (newSenders: SenderAccount[]) => {
    setSenders(newSenders);
    try {
      localStorage.setItem('xsendflow_senders', JSON.stringify(newSenders));
      window.dispatchEvent(new Event('xsendflow_senders_updated'));
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  const handleProviderPreset = (provider: string) => {
    if (provider === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(587);
    } else if (provider === 'outlook') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
    } else if (provider === 'zoho') {
      setSmtpHost('smtp.zoho.com');
      setSmtpPort(465);
    } else if (provider === 'hostinger') {
      setSmtpHost('smtp.hostinger.com');
      setSmtpPort(465);
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
    } catch {
      // Ignore
    }
  };

  const handleDeleteSender = (id: string) => {
    if (!confirm('Remove this SMTP sender account?')) return;
    handleUpdateSenders(senders.filter(s => s.id !== id));
  };

  const handleSaveApiKeys = () => {
    try {
      localStorage.setItem('xsendflow_gemini_key', geminiKey.trim());
      localStorage.setItem('xsendflow_deepseek_key', deepseekKey.trim());
      localStorage.setItem('xsendflow_openai_key', openaiKey.trim());
      setSavedKeySuccess(true);
      setTimeout(() => setSavedKeySuccess(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleSavePreferences = () => {
    setSavedPrefSuccess(true);
    setTimeout(() => setSavedPrefSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Settings &amp; Profile Hub</h3>
              <p className="text-xs text-slate-500">Configure SMTP inboxes, AI API keys, and global sending defaults</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Sidebar Tabs */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Sub Navigation Sidebar */}
          <div className="w-full sm:w-48 bg-slate-50/80 border-b sm:border-b-0 sm:border-r border-slate-200 p-3 space-y-1 shrink-0">
            <button
              onClick={() => setActiveTab('senders')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'senders'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>SMTP Senders ({senders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'api'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-purple-600" />
              <span>AI &amp; API Keys</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'preferences'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>Preferences</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'billing'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Plan &amp; Billing</span>
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 p-6 overflow-y-auto min-h-[400px]">
            {/* ═══ TAB 1: SMTP SENDERS ═══ */}
            {activeTab === 'senders' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Connected SMTP Outbound Accounts</h4>
                    <p className="text-xs text-slate-500">Add multiple inboxes for weighted volume rotation</p>
                  </div>
                  <button
                    data-testid="add-sender-btn"
                    onClick={() => {
                      const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
                      if (!canAddMailbox(senders.length, userPlan)) {
                        setIsUpgradeOpen(true);
                        return;
                      }
                      setIsAddingSender(!isAddingSender);
                    }}
                    className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingSender ? 'Cancel' : 'Add Account'}</span>
                  </button>
                </div>

                {isAddingSender && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Presets:</span>
                      <button onClick={() => handleProviderPreset('gmail')} className="text-[11px] font-bold px-2 py-0.5 bg-white border rounded">Google Workspace</button>
                      <button onClick={() => handleProviderPreset('outlook')} className="text-[11px] font-bold px-2 py-0.5 bg-white border rounded">Outlook 365</button>
                      <button onClick={() => handleProviderPreset('zoho')} className="text-[11px] font-bold px-2 py-0.5 bg-white border rounded">Zoho</button>
                      <button onClick={() => handleProviderPreset('hostinger')} className="text-[11px] font-bold px-2 py-0.5 bg-white border rounded">Hostinger</button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address *</label>
                        <input
                          data-testid="smtp-email"
                          type="email"
                          placeholder="you@domain.com"
                          value={email}
                          onChange={e => { setEmail(e.target.value); if (!smtpUser) setSmtpUser(e.target.value); }}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Account Label</label>
                        <input
                          data-testid="smtp-label"
                          type="text"
                          placeholder="Primary Sender"
                          value={label}
                          onChange={e => setLabel(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">SMTP Host</label>
                        <input
                          data-testid="smtp-host"
                          type="text"
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">SMTP Port</label>
                        <input
                          data-testid="smtp-port"
                          type="number"
                          value={smtpPort}
                          onChange={e => setSmtpPort(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">SMTP Username</label>
                        <input
                          data-testid="smtp-user"
                          type="text"
                          value={smtpUser}
                          onChange={e => setSmtpUser(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Daily Cap</label>
                        <input
                          data-testid="smtp-limit"
                          type="number"
                          value={dailyLimit}
                          onChange={e => setDailyLimit(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">SMTP Password / App Secret</label>
                        <div className="relative">
                          <input
                            data-testid="smtp-pass"
                            type={showPass ? 'text' : 'password'}
                            placeholder="App password"
                            value={smtpPass}
                            onChange={e => setSmtpPass(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 pr-9 font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                          >
                            {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {smtpTestResult && (
                      <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border font-medium ${
                        smtpTestResult.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {smtpTestResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        <span>{smtpTestResult.msg}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        data-testid="test-handshake-btn"
                        type="button"
                        onClick={handleTestSmtp}
                        disabled={testingSmtp}
                        className="text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1"
                      >
                        {testingSmtp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                        <span>Test Handshake</span>
                      </button>
                      <button
                        data-testid="save-account-btn"
                        type="button"
                        onClick={handleAddSender}
                        className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg shadow-xs"
                      >
                        Save Account
                      </button>
                    </div>
                  </div>
                )}

                {/* Senders List */}
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {senders.map(sn => (
                    <div key={sn.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{sn.label}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {sn.email} • {sn.smtpHost}:{sn.smtpPort} • Cap: {sn.dailyLimit}/day
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSender(sn.id)}
                        className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TAB 2: AI & API KEYS ═══ */}
            {activeTab === 'api' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">AI Model &amp; API Keys</h4>
                  <p className="text-xs text-slate-500">Provide your own API keys for unlimited DeepSeek or OpenAI icebreaker generation</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                      <span>Google Gemini API Key (Gemini 2.0 Flash / Ultra-Fast)</span>
                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Recommended Free Tier</span>
                    </label>
                    <input
                      data-testid="gemini-key-input"
                      type="password"
                      placeholder="AIzaSy..."
                      value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                    />
                    <span className="text-[11px] text-slate-400 block">Get your free key from Google AI Studio (aistudio.google.com). Generates 1-sentence icebreakers &amp; Spintax in milliseconds.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">DeepSeek API Key (Optional)</label>
                    <input
                      data-testid="deepseek-key-input"
                      type="password"
                      placeholder="sk-..."
                      value={deepseekKey}
                      onChange={e => setDeepseekKey(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                    />
                    <span className="text-[11px] text-slate-400 block">Used for 90% cheaper token consumption.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">OpenAI API Key (Optional)</label>
                    <input
                      data-testid="openai-key-input"
                      type="password"
                      placeholder="sk-proj-..."
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono"
                    />
                  </div>

                  {savedKeySuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>API keys encrypted and saved locally in your browser!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      data-testid="save-keys-btn"
                      onClick={handleSaveApiKeys}
                      className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-xs active:scale-95"
                    >
                      Save API Keys
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 3: PREFERENCES ═══ */}
            {activeTab === 'preferences' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Default Sending Preferences</h4>
                  <p className="text-xs text-slate-500">Configure global defaults applied to new campaigns</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Default Target Timezone</label>
                    <select
                      value={defaultTimezone}
                      onChange={e => setDefaultTimezone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                    >
                      <option value="America/New_York (EST)">America/New_York (EST / EDT)</option>
                      <option value="America/Chicago (CST)">America/Chicago (CST / CDT)</option>
                      <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST / PDT)</option>
                      <option value="Europe/London (GMT)">Europe/London (GMT / BST)</option>
                      <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Default Random Delay (Seconds)</label>
                    <input
                      type="number"
                      value={defaultDelay}
                      onChange={e => setDefaultDelay(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                    />
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
                      <span>Preferences updated successfully!</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSavePreferences}
                      className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-xs active:scale-95"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TAB 4: PLAN & BILLING ═══ */}
            {activeTab === 'billing' && (
              <div className="space-y-6 animate-in fade-in">
                {(() => {
                  const userPlan = (typeof window !== 'undefined' ? localStorage.getItem('xsendflow_user_plan') : 'free') as UserPlan || 'free';
                  return (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Subscription &amp; Resource Quotas</h4>
                          <p className="text-xs text-slate-500">Manage your active tier, sending volume, and cloud worker seats</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold uppercase">
                          Current: {userPlan.toUpperCase()}
                        </div>
                      </div>

                      {/* Quota Progress Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Daily Send Quota</span>
                          <div className="text-lg font-extrabold text-slate-900 font-mono">
                            {userPlan === 'free' ? '0 / 50' : 'Unlimited'}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {userPlan === 'free' ? 'Resets at 00:00 UTC' : 'Provider Safe Limits'}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Connected Mailboxes</span>
                          <div className="text-lg font-extrabold text-slate-900 font-mono">
                            {senders.length} / {userPlan === 'free' ? '1' : 'Unlimited'}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {userPlan === 'free' ? 'Single Sender' : 'Multi-Inbox Rotation'}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">24/7 VPS Background</span>
                          <div className="text-lg font-extrabold text-slate-900 font-mono">
                            {userPlan === 'free' ? 'Browser Only' : 'Active Daemon'}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            {userPlan === 'free' ? 'Upgrade to Pro' : '68.233.104.131'}
                          </span>
                        </div>
                      </div>

                      {/* Upgrade Options */}
                      {userPlan === 'free' && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-[#0b1022] to-purple-950 text-white border border-indigo-500/30 shadow-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-indigo-500/20 text-cyan-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-cyan-400" /> RECOMMENDED UPGRADE
                              </span>
                              <h5 className="text-base font-extrabold text-white">Upgrade to Pro Unlimited ($29/mo)</h5>
                              <p className="text-xs text-slate-300 max-w-md">
                                Connect unlimited mailboxes, send 25,000+ emails/mo, and dispatch 24/7 in the cloud on our dedicated VPS worker.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setIsUpgradeOpen(true); }}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/25 shrink-0 active:scale-95 transition-all"
                            >
                              Upgrade to Pro ➔
                            </button>
                          </div>
                        </div>
                      )}

                      {userPlan === 'pro' && (
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950 via-[#0b1022] to-slate-900 text-white border border-purple-500/30 shadow-xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                <Building2 className="w-3 h-3 text-purple-400" /> AGENCY FLEETS
                              </span>
                              <h5 className="text-base font-extrabold text-white">Upgrade to Agency Scale ($79/mo)</h5>
                              <p className="text-xs text-slate-300 max-w-md">
                                Multi-client workspace isolation, shareable live client performance reports (/report/[token]), and dedicated VPS IP routing.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setIsUpgradeOpen(true); }}
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-purple-500/25 shrink-0 active:scale-95 transition-all"
                            >
                              Upgrade to Agency ➔
                            </button>
                          </div>
                        </div>
                      )}

                      {userPlan === 'agency' && (
                        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <h5 className="text-sm font-extrabold text-slate-900">Agency Scale Tier Active</h5>
                          </div>
                          <p className="text-xs text-slate-600">
                            You have full unrestricted access to all features, client reporting portals, and unlimited multi-mailbox rotation.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeProModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        triggerReason="mailbox_limit"
      />
    </div>
  );
}
