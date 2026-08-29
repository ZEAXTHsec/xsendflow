'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  User, CreditCard, Server, Key, Sliders, Download, LogOut, 
  ChevronDown, Crown, Building2, Zap, Sparkles, Check, Copy, ShieldCheck 
} from 'lucide-react';
import { UserPlan } from '@/lib/planLimits';
import { getStoredLicense, LicenseDetails } from '@/lib/licenseEngine';
import { createClient } from '@/lib/supabase/client';

interface Props {
  userEmail?: string | null;
  userId?: string | null;
  userPlan?: UserPlan;
  onOpenSettings?: (tab?: 'profile' | 'billing' | 'senders' | 'api' | 'preferences') => void;
  onOpenUpgrade?: () => void;
  onExportBackup?: () => void;
}

export default function UserProfileMenu({
  userEmail,
  userId,
  userPlan: propPlan,
  onOpenSettings,
  onOpenUpgrade,
  onExportBackup,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [license, setLicense] = useState<LicenseDetails>(getStoredLicense);
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === 'undefined') return 'Founder';
    return localStorage.getItem('xsendflow_display_name') || (userEmail ? userEmail.split('@')[0] : 'Founder');
  });
  const [orgName, setOrgName] = useState(() => {
    if (typeof window === 'undefined') return 'Growth Studio';
    return localStorage.getItem('xsendflow_org_name') || 'Growth Studio';
  });
  const [sendersCount, setSendersCount] = useState(0);

  const currentPlan = propPlan || license.plan || 'free';
  const supabase = createClient();

  useEffect(() => {
    const updateDetails = () => {
      setLicense(getStoredLicense());
      if (typeof window !== 'undefined') {
        const storedName = localStorage.getItem('xsendflow_display_name');
        if (storedName) setDisplayName(storedName);
        const storedOrg = localStorage.getItem('xsendflow_org_name');
        if (storedOrg) setOrgName(storedOrg);
        try {
          const senders = JSON.parse(localStorage.getItem('xsendflow_senders') || '[]');
          if (Array.isArray(senders)) setSendersCount(senders.length);
        } catch {}
      }
    };

    updateDetails();
    window.addEventListener('xsendflow_license_updated', updateDetails);
    window.addEventListener('xsendflow_plan_updated', updateDetails);
    window.addEventListener('xsendflow_senders_updated', updateDetails);

    return () => {
      window.removeEventListener('xsendflow_license_updated', updateDetails);
      window.removeEventListener('xsendflow_plan_updated', updateDetails);
      window.removeEventListener('xsendflow_senders_updated', updateDetails);
    };
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xsendflow_mock_user');
      window.location.href = '/login';
    }
  };

  const handleCopyLicenseKey = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(license.licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const initials = (displayName || userEmail || 'AF')
    .slice(0, 2)
    .toUpperCase();

  const handleMenuClick = (tab: 'profile' | 'billing' | 'senders' | 'api' | 'preferences') => {
    setIsOpen(false);
    onOpenSettings?.(tab);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`group flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-2xl border transition-all duration-150 active:scale-95 ${
          isOpen
            ? 'bg-slate-100/90 border-slate-300 shadow-sm ring-2 ring-indigo-500/20'
            : 'bg-white/80 hover:bg-slate-100/80 border-slate-200 shadow-2xs hover:border-slate-300'
        }`}
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-xs transition-transform group-hover:scale-105 ${
          currentPlan === 'agency'
            ? 'bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 ring-2 ring-amber-400/30'
            : currentPlan === 'pro'
            ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 ring-2 ring-indigo-400/30'
            : 'bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 ring-1 ring-slate-400/30'
        }`}>
          {initials}
        </div>

        {/* User Info (Hidden on small mobile) */}
        <div className="hidden md:flex flex-col text-left pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-900 leading-tight truncate max-w-[120px]">
              {displayName}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              currentPlan === 'agency' ? 'bg-amber-500' : currentPlan === 'pro' ? 'bg-indigo-500' : 'bg-emerald-500'
            }`} />
          </div>
          <span className="text-[10px] font-mono text-slate-500 leading-tight">
            {currentPlan === 'agency' ? 'Agency Scale' : currentPlan === 'pro' ? 'Pro Unlimited' : 'Free Plan'}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-indigo-600' : ''
        }`} />
      </button>

      {/* Smooth Glassmorphism Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right overflow-hidden">
          {/* Header Card with Tier & Expiry */}
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-xs ${
                  currentPlan === 'agency'
                    ? 'bg-gradient-to-tr from-amber-600 to-yellow-400'
                    : currentPlan === 'pro'
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600'
                    : 'bg-slate-800'
                }`}>
                  {initials}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 truncate max-w-[170px]">{displayName}</h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-[170px]">{userEmail || 'outreach@company.com'}</p>
                </div>
              </div>

              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                currentPlan === 'agency'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : currentPlan === 'pro'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {currentPlan}
              </span>
            </div>

            {/* License & Expiration Pill */}
            <div className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                <span>Key:</span>
                <strong className="text-indigo-600 font-bold">{license.licenseKey.slice(0, 12)}...</strong>
                <button
                  type="button"
                  onClick={handleCopyLicenseKey}
                  className="text-slate-400 hover:text-slate-700 ml-0.5"
                  title="Copy License Key"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {currentPlan !== 'free' ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {license.daysRemaining}d left
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); onOpenUpgrade?.(); }}
                  className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                >
                  Upgrade ➔
                </button>
              )}
            </div>
          </div>

          {/* Core Settings Menu Items */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => handleMenuClick('profile')}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors"
            >
              <User className="w-4 h-4 text-indigo-600" />
              <div className="flex-1">
                <span className="block font-bold">Profile &amp; Organization</span>
                <span className="block text-[10px] text-slate-400 font-normal">Team details &amp; reply-to defaults</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMenuClick('billing')}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-purple-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">License &amp; Billing</span>
                  {currentPlan !== 'free' && (
                    <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded font-bold">Active</span>
                  )}
                </div>
                <span className="block text-[10px] text-slate-400 font-normal">Vouchers, quotas &amp; plan upgrades</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMenuClick('senders')}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors"
            >
              <Server className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Mailboxes &amp; Senders</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">{sendersCount}</span>
                </div>
                <span className="block text-[10px] text-slate-400 font-normal">Gmail, Hostinger &amp; SMTP relays</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMenuClick('api')}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors"
            >
              <Key className="w-4 h-4 text-amber-600" />
              <div className="flex-1">
                <span className="block font-bold">AI Models &amp; API Keys</span>
                <span className="block text-[10px] text-slate-400 font-normal">Google Gemini, OpenAI &amp; DeepSeek</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMenuClick('preferences')}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors"
            >
              <Sliders className="w-4 h-4 text-emerald-600" />
              <div className="flex-1">
                <span className="block font-bold">Dispatch Defaults &amp; Jitter</span>
                <span className="block text-[10px] text-slate-400 font-normal">Sending windows &amp; opt-out footers</span>
              </div>
            </button>

            {onExportBackup && (
              <button
                type="button"
                onClick={() => { setIsOpen(false); onExportBackup(); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <span className="block font-bold">Backup Workspace JSON</span>
                  <span className="block text-[10px] text-slate-400 font-normal">1-click full offline export</span>
                </div>
              </button>
            )}
          </div>

          {/* Sign Out Footer */}
          <div className="p-1.5 border-t border-slate-100 bg-slate-50/40">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out of Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
