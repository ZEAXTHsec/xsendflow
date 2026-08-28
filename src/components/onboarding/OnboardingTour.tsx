'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronUp, ChevronDown, Sparkles, X, ArrowRight, ShieldCheck, Mail, Zap, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  onNavigateTab: (tab: 'campaigns' | 'cleaner' | 'sequence' | 'pitch' | 'analytics') => void;
  onOpenSettings: () => void;
}

const getInitialDismissed = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('xsendflow_onboarding_dismissed') === 'true';
  } catch {
    return false;
  }
};

const getInitialSteps = (): Record<string, boolean> => {
  const defaults: Record<string, boolean> = {
    inboxes: true, // defaulted since 4 inboxes are active
    cleaner: false,
    sequence: true, // defaulted with 7-figure copy
    campaign: false
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const camps = localStorage.getItem('xsendflow_campaigns_v2');
    if (camps) {
      const parsed = JSON.parse(camps);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { ...defaults, campaign: true, cleaner: true };
      }
    }
  } catch {
    // Ignore
  }
  return defaults;
};

export default function OnboardingTour({ onNavigateTab, onOpenSettings }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(getInitialDismissed);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(getInitialSteps);

  const steps = [
    {
      id: 'inboxes',
      title: 'Connected Outbound Inboxes',
      desc: 'Google Workspace & Hostinger SMTP active',
      completed: completedSteps.inboxes,
      action: () => onOpenSettings(),
      actionLabel: 'Settings',
      icon: Settings
    },
    {
      id: 'cleaner',
      title: 'Sanitize Leads & Icebreakers',
      desc: 'Clean CSV & generate 1-to-1 icebreakers',
      completed: completedSteps.cleaner,
      action: () => onNavigateTab('cleaner'),
      actionLabel: 'Pillar 1',
      icon: ShieldCheck
    },
    {
      id: 'sequence',
      title: '7-Figure Spintax Sequence',
      desc: 'Anti-AI-slop copy & spam guard',
      completed: completedSteps.sequence,
      action: () => onNavigateTab('sequence'),
      actionLabel: 'Pillar 3',
      icon: Zap
    },
    {
      id: 'campaign',
      title: 'Launch & Verify Campaign',
      desc: 'Automated delivery with Gaussian jitter',
      completed: completedSteps.campaign,
      action: () => onNavigateTab('campaigns'),
      actionLabel: 'Pillar 2',
      icon: Mail
    }
  ];

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('xsendflow_onboarding_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden transition-all animate-in slide-in-from-bottom-5 duration-200">
      {/* Header Bar */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-4 h-4 text-purple-200" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight">Outbound Setup Checklist</h4>
            <p className="text-[10px] text-slate-300 font-mono">{completedCount} of {steps.length} Steps Ready ({progressPercent}%)</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-white/10 transition-colors"
            title="Dismiss Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Expandable Step List */}
      {isExpanded && (
        <div className="p-4 space-y-2.5 bg-white text-xs divide-y divide-slate-100">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div key={st.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <button
                    onClick={() => {
                      const next = !completedSteps[st.id];
                      setCompletedSteps(prev => ({ ...prev, [st.id]: next }));
                      if (next && completedCount + 1 === steps.length) {
                        try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } }); } catch {}
                      }
                    }}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                  >
                    {st.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <span className={`font-bold flex items-center gap-1.5 truncate ${st.completed ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                      <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{st.title}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">{st.desc}</span>
                  </div>
                </div>

                <button
                  onClick={st.action}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all shrink-0 flex items-center gap-1"
                >
                  <span>{st.actionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
