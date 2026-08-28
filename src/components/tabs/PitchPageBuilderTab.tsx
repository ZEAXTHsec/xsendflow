'use client';

import React, { useState } from 'react';
import { Monitor, Smartphone, ExternalLink, Sparkles, Video, Calendar, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';
import { Lead, PitchPageConfig } from '@/lib/types';

interface Props {
  leads: Lead[];
  pitchConfig: PitchPageConfig;
  setPitchConfig: React.Dispatch<React.SetStateAction<PitchPageConfig>>;
  onProceedToAnalytics?: () => void;
}

export default function PitchPageBuilderTab({ leads, pitchConfig, setPitchConfig, onProceedToAnalytics }: Props) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || 'demo');
  const [copiedType, setCopiedType] = useState<'md' | 'raw' | null>(null);

  const currentLead = leads.find(l => l.id === selectedLeadId) || {
    cleanFirstName: 'John',
    cleanCompany: 'Stripe',
    cleanTitle: 'VP of Growth',
    pitchSlug: 'stripe-john'
  };

  const handleUpdateConfig = <K extends keyof PitchPageConfig>(field: K, value: PitchPageConfig[K]) => {
    setPitchConfig(prev => ({ ...prev, [field]: value }));
  };

  const previewUrl = `/p/${currentLead.pitchSlug || 'demo'}?name=${encodeURIComponent(currentLead.cleanFirstName)}&company=${encodeURIComponent(currentLead.cleanCompany)}&title=${encodeURIComponent(currentLead.cleanTitle || 'Growth Leader')}&video=${encodeURIComponent(pitchConfig.videoUrl || '')}&cal=${encodeURIComponent(pitchConfig.calendarUrl || '')}`;

  const handleCopyLink = (type: 'md' | 'raw') => {
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${previewUrl}` : previewUrl;
    const textToCopy = type === 'md' ? `[Custom 60s Walkthrough for ${currentLead.cleanCompany}](${fullUrl})` : fullUrl;
    navigator.clipboard.writeText(textToCopy);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
            <Monitor className="w-3.5 h-3.5 text-purple-600" />
            <span>Pillar 3 • Dynamic 1-to-1 Pitch Pages</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Micro-Landing Pages Tailored Per Prospect
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Turn cold emails into personalized landing pages (<code className="text-slate-800 font-mono">/p/stripe-john</code>) with prospect company branding, embedded Loom video walkthroughs, and direct Cal.com booking.
          </p>
        </div>

        {onProceedToAnalytics && (
          <button
            onClick={onProceedToAnalytics}
            className="text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 active:scale-95 glow-tag shrink-0"
          >
            <span>View Campaign Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Page Configuration</h3>
                <p className="text-[11px] text-slate-500">Set assets embedded in all prospect links</p>
              </div>
            </div>

            {/* Select Lead to Preview */}
            {leads.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Preview Prospect</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                >
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.cleanFirstName} at {lead.cleanCompany} ({lead.pitchSlug})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Video Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-600" /> Walkthrough Video / Loom Embed URL
              </label>
              <input
                type="text"
                value={pitchConfig.videoUrl || ''}
                onChange={(e) => handleUpdateConfig('videoUrl', e.target.value)}
                placeholder="https://www.youtube.com/embed/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* Calendar Booking Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Cal.com / Calendly Link
              </label>
              <input
                type="text"
                value={pitchConfig.calendarUrl || ''}
                onChange={(e) => handleUpdateConfig('calendarUrl', e.target.value)}
                placeholder="https://cal.com/yourname/15min"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            {/* CTA Button Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">CTA Button Text</label>
              <input
                type="text"
                value={pitchConfig.ctaText}
                onChange={(e) => handleUpdateConfig('ctaText', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Quick Copy Link Actions */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">1-Click Email Links</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyLink('md')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95"
                >
                  {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                  <span>{copiedType === 'md' ? 'Copied MD' : 'Copy [MD] Link'}</span>
                </button>
                <button
                  onClick={() => handleCopyLink('raw')}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 font-bold transition-all active:scale-95"
                >
                  {copiedType === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{copiedType === 'raw' ? 'Copied URL' : 'Copy Raw URL'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Live prospect route:</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-100 transition-all"
              >
                <span>Open Full Route</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Live Device Mockup Preview Column */}
        <div className="lg:col-span-7 space-y-3">
          {/* Device Switcher */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Prospect Simulation</span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  deviceMode === 'desktop' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Desktop
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  deviceMode === 'mobile' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> Mobile
              </button>
            </div>
          </div>

          {/* Interactive Frame Canvas */}
          <div className="bg-slate-100/70 rounded-3xl p-6 flex justify-center items-center min-h-[520px] border border-slate-200">
            <div
              className={`transition-all duration-300 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl ${
                deviceMode === 'desktop' ? 'w-full max-w-2xl' : 'w-[310px]'
              }`}
            >
              {/* Window Chrome Header */}
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="bg-white px-3 py-0.5 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 truncate max-w-[220px]">
                  🔒 xsendflow.com/p/{currentLead.pitchSlug || 'demo'}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">100% SSL</span>
              </div>

              {/* Mock Page Content */}
              <div className="p-6 space-y-5 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-700 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Prepared for <strong className="text-slate-900">{currentLead.cleanCompany}</strong>
                </div>

                <h4 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                  How {currentLead.cleanCompany} Can Scale Inbound Meetings Without Spam Penalties
                </h4>

                <p className="text-[11px] text-slate-600 max-w-md mx-auto leading-relaxed">
                  Hey {currentLead.cleanFirstName}, our team prepared this 60-second video walkthrough for your role as {currentLead.cleanTitle || 'growth leader'}.
                </p>

                {/* Video Placeholder */}
                <div className="aspect-video w-full rounded-xl bg-slate-900 flex flex-col items-center justify-center p-4 space-y-2 shadow-inner text-white">
                  <div className="w-11 h-11 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-slate-300 font-mono">60s Demo for {currentLead.cleanCompany}</span>
                </div>

                {/* Value Bullets */}
                <div className="grid grid-cols-3 gap-2 text-left pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 100% Inboxing
                    </div>
                    <div className="text-[10px] text-slate-500">Zero spam traps</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-blue-700 text-[10px] font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Spintax
                    </div>
                    <div className="text-[10px] text-slate-500">Unique hashes</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-purple-700 text-[10px] font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> 1-Click
                    </div>
                    <div className="text-[10px] text-slate-500">Direct booking</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-2">
                  <button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs py-3 rounded-xl shadow-md shadow-indigo-500/20 active:scale-95">
                    {pitchConfig.ctaText} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
