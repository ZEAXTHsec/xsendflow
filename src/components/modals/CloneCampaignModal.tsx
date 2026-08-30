'use client';

import React, { useState } from 'react';
import { X, Copy, Clock, Calendar, ShieldCheck, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { Campaign } from '../tabs/CampaignsTab';
import { GLOBAL_TIMEZONES, getDefaultDynamicWindow } from '@/lib/engine/timeZoneScheduler';
import { UserPlan } from '@/lib/planLimits';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  onCloneConfirm: (clonedCampaign: Campaign) => void;
}

export default function CloneCampaignModal({
  isOpen,
  onClose,
  campaign,
  onCloneConfirm
}: Props) {
  if (!isOpen || !campaign) return null;

  const initialDynamic = getDefaultDynamicWindow(campaign.timezone);

  const [newName, setNewName] = useState(`${campaign.name} (Copy)`);
  const [timezone, setTimezone] = useState(campaign.timezone || initialDynamic.detectedTimezone);
  const [is24Hours, setIs24Hours] = useState(campaign.is24Hours || false);
  const [windowStart, setWindowStart] = useState(initialDynamic.windowStart);
  const [windowEnd, setWindowEnd] = useState(initialDynamic.windowEnd);
  const [resetLeadStatus, setResetLeadStatus] = useState(true);
  const [dailyLimit, setDailyLimit] = useState(campaign.dailyLimit || 100);
  const [delaySeconds, setDelaySeconds] = useState(campaign.delaySeconds || 45);

  const handleTimezoneChange = (newTz: string) => {
    setTimezone(newTz);
    const dynamic = getDefaultDynamicWindow(newTz);
    setWindowStart(dynamic.windowStart);
    setWindowEnd(dynamic.windowEnd);
  };

  const handleConfirm = () => {
    if (!newName.trim()) {
      alert('Please provide a name for the duplicated campaign.');
      return;
    }

    const resetRecipients = campaign.recipients.map((r, idx) => ({
      ...r,
      id: `lead-${Date.now()}-${idx}`,
      status: resetLeadStatus ? ('pending' as const) : r.status,
      sentAt: resetLeadStatus ? undefined : r.sentAt,
      error: undefined
    }));

    const cloned: Campaign = {
      ...campaign,
      id: `camp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: newName.trim(),
      status: 'paused',
      timezone,
      is24Hours,
      windowStart: is24Hours ? '00:00' : windowStart,
      windowEnd: is24Hours ? '23:59' : windowEnd,
      dailyLimit,
      delaySeconds,
      recipients: resetRecipients,
      createdAt: new Date().toISOString()
    };

    onCloneConfirm(cloned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Duplicate &amp; Re-Schedule Campaign</h3>
              <p className="text-xs text-slate-500">Configure new sending window and reset lead queues</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">New Campaign Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Q4 Outreach (Copy 2)"
            />
          </div>

          {/* Timeframe & Schedule Configuration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Dispatch Timeframe &amp; Schedule
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={is24Hours}
                  onChange={e => setIs24Hours(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>⚡ 24/7 Continuous Mode</span>
              </label>
            </div>

            {/* Target Timezone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500">Target Audience Timezone</label>
              <select
                value={timezone}
                onChange={e => handleTimezoneChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              >
                {GLOBAL_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
            </div>

            {/* Window Hours (hidden if 24/7) */}
            {!is24Hours && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Window Start Time</label>
                  <input
                    type="time"
                    value={windowStart}
                    onChange={e => setWindowStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">Window End Time</label>
                  <input
                    type="time"
                    value={windowEnd}
                    onChange={e => setWindowEnd(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Lead Reset & Quotas */}
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={resetLeadStatus}
                onChange={e => setResetLeadStatus(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <div className="text-xs text-slate-700">
                <span className="font-bold text-emerald-950 block">Reset all ({campaign.recipients.length}) contacts to Pending</span>
                <span className="text-[11px] text-emerald-800">Allows sending the sequence from Touch 1 to this contact list again.</span>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Daily Email Limit</label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={e => setDailyLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Jitter Delay (Seconds)</label>
                <input
                  type="number"
                  value={delaySeconds}
                  onChange={e => setDelaySeconds(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Plan Limit Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <span className="font-bold block">📌 Cloned Campaign Default:</span>
            <p className="text-[11px] leading-relaxed">
              This campaign will be saved as <strong>Paused</strong> with updated time windows and clean contact queues. You can inspect its steps, review contacts, and click <strong>Start</strong> whenever ready.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Confirm &amp; Duplicate Campaign</span>
          </button>
        </div>
      </div>
    </div>
  );
}
