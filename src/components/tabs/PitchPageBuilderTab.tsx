'use client';

import React, { useState } from 'react';
import { 
  Monitor, Smartphone, ExternalLink, Sparkles, Video, Calendar, 
  ArrowRight, ShieldCheck, Copy, Check, Eye, Play, Sparkle, Layers 
} from 'lucide-react';
import { Lead, PitchPageConfig } from '@/lib/types';
import confetti from 'canvas-confetti';

interface Props {
  leads: Lead[];
  pitchConfig: PitchPageConfig;
  setPitchConfig: React.Dispatch<React.SetStateAction<PitchPageConfig>>;
  onProceedToAnalytics?: () => void;
}

// Convert regular Loom/YouTube/Vimeo URLs to embed URLs
function formatEmbedUrl(url: string): string {
  if (!url) return 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0';
  
  // Loom (e.g. https://www.loom.com/share/abc -> https://www.loom.com/embed/abc)
  if (url.includes('loom.com/share/')) {
    return url.replace('loom.com/share/', 'loom.com/embed/');
  }
  // YouTube watch link (e.g. https://www.youtube.com/watch?v=abc -> https://www.youtube.com/embed/abc)
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  // YouTube youtu.be link
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
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

  const formattedVideo = formatEmbedUrl(pitchConfig.videoUrl || '');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://xsendflow.com';
  const previewPath = `/p/${currentLead.pitchSlug || 'demo'}?name=${encodeURIComponent(currentLead.cleanFirstName)}&company=${encodeURIComponent(currentLead.cleanCompany)}&title=${encodeURIComponent(currentLead.cleanTitle || 'Growth Leader')}&video=${encodeURIComponent(formattedVideo)}&cal=${encodeURIComponent(pitchConfig.calendarUrl || 'https://cal.com')}`;
  const fullLiveUrl = `${appUrl}${previewPath}`;

  const handleCopyLink = (type: 'md' | 'raw') => {
    const textToCopy = type === 'md' ? `[Custom 60s Walkthrough for ${currentLead.cleanCompany}](${fullLiveUrl})` : fullLiveUrl;
    navigator.clipboard.writeText(textToCopy);
    setCopiedType(type);
    try { confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } }); } catch {}
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 1. EXECUTIVE COMMAND HERO BAR */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0b101b] border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>1-to-1 Video Landing Sites • 100% Free</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>1 Master Loom ➔ 10,000 Dynamic Pages</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Personalized Pitch Pages Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Record 1 single 60-second Loom or YouTube video. XSendFlow automatically personalizes the landing site (<code className="text-purple-300 font-mono">/p/stripe-john</code>) with each prospect&apos;s company name, custom title, and Cal.com meeting booking widget for \$0.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={fullLiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>Open Live Public Page</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. BUILDER WORKSPACE (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Page Configuration
                </h3>
                <p className="text-xs text-slate-500">Assets embedded dynamically into all prospect links.</p>
              </div>
            </div>

            {/* Select Lead to Preview */}
            {leads.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Preview Prospect</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-semibold"
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
                placeholder="https://www.loom.com/share/... or YouTube link"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">Supports Loom, YouTube, and Vimeo links.</p>
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
                value={pitchConfig.ctaText || 'Book 15-Min Intro Call'}
                onChange={(e) => handleUpdateConfig('ctaText', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* 1-Click Copy Links */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">1-Click Sequence Links</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink('md')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy [MD] Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyLink('raw')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedType === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Raw URL</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Device Frame */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Live Prospect Simulation</h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    deviceMode === 'desktop' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    deviceMode === 'mobile' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Interactive Browser Frame */}
            <div className={`mx-auto transition-all rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-2xl ${
              deviceMode === 'mobile' ? 'max-w-xs' : 'w-full'
            }`}>
              {/* Browser chrome */}
              <div className="bg-slate-950 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                </div>
                <div className="bg-slate-900 rounded-lg px-3 py-1 text-[11px] font-mono text-slate-400 flex-1 text-center truncate">
                  🔒 xsendflow.com/p/{currentLead.pitchSlug}
                </div>
              </div>

              {/* Pitch Page Contents Preview */}
              <div className="bg-slate-50 p-6 sm:p-8 space-y-6 text-slate-900 max-h-[480px] overflow-y-auto">
                <div className="text-center space-y-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                    Prepared for {currentLead.cleanCompany}
                  </span>
                  <h4 className="text-lg font-black text-slate-950 leading-snug">
                    How {currentLead.cleanCompany} Can Scale Inbound Meetings Without Spam Penalties
                  </h4>
                  <p className="text-xs text-slate-600">
                    Hey <span className="font-bold text-slate-900">{currentLead.cleanFirstName}</span>, our team prepared this 60-second video walkthrough for your role as {currentLead.cleanTitle || 'Growth Leader'}.
                  </p>
                </div>

                {/* Video Embed */}
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-lg">
                  <iframe
                    src={formattedVideo}
                    title="Live Preview"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>

                {/* CTA Button */}
                <div className="text-center pt-2">
                  <a
                    href={pitchConfig.calendarUrl || 'https://cal.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-md inline-flex items-center gap-2"
                  >
                    <span>{pitchConfig.ctaText || 'Book 15-Min Intro Call'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
