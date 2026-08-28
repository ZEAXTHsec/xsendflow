'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, Copy, Check, Globe, History } from 'lucide-react';
import { DomainHealthResult } from '@/lib/types';

export default function DnsShieldTab() {
  const [domainInput, setDomainInput] = useState('xsendflow.com');
  const [recentDomains, setRecentDomains] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['xsendflow.com', 'gmail.com'];
    try {
      const saved = localStorage.getItem('xsendflow_recent_domains');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return ['xsendflow.com', 'gmail.com'];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DomainHealthResult | null>(null);
  const [activeProvider, setActiveProvider] = useState<'cloudflare' | 'godaddy' | 'namecheap'>('cloudflare');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const saveRecentDomain = (domain: string) => {
    const updated = [domain, ...recentDomains.filter(d => d !== domain)].slice(0, 5);
    setRecentDomains(updated);
    try {
      localStorage.setItem('xsendflow_recent_domains', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleCheckDomain = async (targetDomain?: string) => {
    const domainToCheck = (targetDomain || domainInput).trim();
    if (!domainToCheck) return;

    if (targetDomain) {
      setDomainInput(targetDomain);
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/dns/check-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainToCheck })
      });
      const data = await res.json();
      if (data.health) {
        setResult(data.health);
        saveRecentDomain(data.health.domain);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Pillar 4 • DNS &amp; Deliverability Health Shield</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Real-Time SPF, DKIM, DMARC &amp; MX Verification
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Audit your secondary sending domains against Google &amp; Yahoo bulk-sender requirements before firing campaigns from the desktop engine.
          </p>
        </div>

        {/* Quick Domain Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mr-1">
            <History className="w-3 h-3" /> Recent:
          </span>
          {recentDomains.map(dom => (
            <button
              key={dom}
              onClick={() => handleCheckDomain(dom)}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-all active:scale-95 font-mono"
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="Enter domain (e.g. mail-outreach.com)"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <button
            onClick={() => handleCheckDomain()}
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-7 py-3 rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 glow-tag"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Run Health Audit</span>
          </button>
        </div>
      </div>

      {/* Audit Result Display */}
      {result && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Sending Domain</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono">{result.domain}</h3>
              <p className="text-[11px] text-slate-500">Audited at {new Date(result.checkedAt).toLocaleTimeString()}</p>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Deliverability Score</span>
                <span className={`text-3xl font-black font-mono tnum ${result.score >= 75 ? 'text-emerald-600' : result.score >= 50 ? 'text-amber-700' : 'text-rose-600'}`}>
                  {result.score} / 100
                </span>
              </div>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border font-black text-lg shadow-sm ${
                result.score >= 75
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : result.score >= 50
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}>
                {result.score >= 75 ? 'PASS' : result.score >= 50 ? 'WARN' : 'FAIL'}
              </div>
            </div>
          </div>

          {/* 4 Pillars Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SPF Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">SPF Record</span>
                  <span className="text-[10px] text-slate-500 font-mono">v=spf1</span>
                </div>
                {result.spf.valid ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                  </span>
                ) : (
                  <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Missing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{result.spf.message}</p>
              {result.spf.record && (
                <div className="bg-slate-50 p-3 rounded-xl font-mono text-[11px] text-emerald-700 break-all border border-slate-200">
                  {result.spf.record}
                </div>
              )}
            </div>

            {/* DKIM Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">DKIM Public Key</span>
                  <span className="text-[10px] text-slate-500 font-mono">_domainkey</span>
                </div>
                {result.dkim.valid ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid
                  </span>
                ) : (
                  <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Custom Selector
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{result.dkim.message}</p>
              {result.dkim.selector && (
                <div className="bg-slate-50 p-3 rounded-xl font-mono text-[11px] text-blue-700 break-all border border-slate-200">
                  Active Selector: {result.dkim.selector}
                </div>
              )}
            </div>

            {/* DMARC Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">DMARC Policy</span>
                  <span className="text-[10px] text-slate-500 font-mono">_dmarc</span>
                </div>
                {result.dmarc.valid ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active (p={result.dmarc.policy})
                  </span>
                ) : (
                  <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Missing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{result.dmarc.message}</p>
              {result.dmarc.record && (
                <div className="bg-slate-50 p-3 rounded-xl font-mono text-[11px] text-emerald-700 break-all border border-slate-200">
                  {result.dmarc.record}
                </div>
              )}
            </div>

            {/* MX Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">MX Mail Routing</span>
                  <span className="text-[10px] text-slate-500 font-mono">Inbound</span>
                </div>
                {result.mx.valid ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                  </span>
                ) : (
                  <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" /> Missing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{result.mx.message}</p>
              {result.mx.records.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl font-mono text-[11px] text-slate-700 space-y-1 border border-slate-200">
                  {result.mx.records.slice(0, 2).map((rec, i) => (
                    <div key={i} className="truncate">• {rec}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 1-Click DNS Fix Generator */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">1-Click DNS Fix Generator</h4>
                <p className="text-xs text-slate-500">Copy-paste these exact values into your DNS provider.</p>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['cloudflare', 'godaddy', 'namecheap'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setActiveProvider(p)}
                    className={`px-3.5 py-1 text-xs rounded-lg capitalize font-bold transition-all ${
                      activeProvider === p ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* DNS Records Table */}
            <div className="space-y-3">
              {/* SPF Snippet */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">TXT Record (@)</span>
                    <span className="text-[10px] text-slate-500 font-mono">SPF</span>
                  </div>
                  <code className="text-xs text-emerald-700 font-mono font-bold">v=spf1 include:_spf.google.com ~all</code>
                </div>
                <button
                  onClick={() => handleCopy('spf', 'v=spf1 include:_spf.google.com ~all')}
                  className="text-xs bg-white hover:bg-slate-100 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 shrink-0 font-bold active:scale-95 transition-all shadow-xs"
                >
                  {copiedKey === 'spf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'spf' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* DMARC Snippet */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">TXT Record (_dmarc)</span>
                    <span className="text-[10px] text-slate-500 font-mono">DMARC</span>
                  </div>
                  <code className="text-xs text-emerald-700 font-mono font-bold">{`v=DMARC1; p=none; rua=mailto:dmarc@${result.domain}`}</code>
                </div>
                <button
                  onClick={() => handleCopy('dmarc', `v=DMARC1; p=none; rua=mailto:dmarc@${result.domain}`)}
                  className="text-xs bg-white hover:bg-slate-100 text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 shrink-0 font-bold active:scale-95 transition-all shadow-xs"
                >
                  {copiedKey === 'dmarc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'dmarc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
