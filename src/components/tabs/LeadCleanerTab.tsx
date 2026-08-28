'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, Sparkles, AlertTriangle, CheckCircle2, Trash2, Filter, ArrowRight, Copy, Check, Search, ShieldCheck, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead } from '@/lib/types';
import { sanitizeFirstName, sanitizeCompanyName, sanitizeJobTitle, isRoleBasedEmail, isValidEmailFormat, generateLocalIcebreaker, createSlug } from '@/lib/sanitizer';

interface Props {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onProceedToSequence: () => void;
}

const SAMPLE_DIRTY_DATA: Partial<Lead>[] = [
  { rawFirstName: 'DR. ROBERT SMITH JR. (CEO)', rawCompany: 'Acme Solutions LLC Inc.', rawTitle: 'Chief Growth Officer & AI Strategist', email: 'robert@acmesolutions.com' },
  { rawFirstName: 'sarah (hiring 10+ devs)', rawCompany: 'STRIPE PAYMENTS CORP', rawTitle: 'Head of Developer Experience', email: 'sarah.j@stripe.com' },
  { rawFirstName: 'MICHAEL O\'CONNOR [Founder]', rawCompany: 'DataFlow Systems Pvt Ltd.', rawTitle: 'VP of Engineering / Co-Founder', email: 'moconnor@dataflow.io' },
  { rawFirstName: 'support team', rawCompany: 'Generic Retail Store Co.', rawTitle: 'Customer Support Rep', email: 'support@genericretail.com' },
  { rawFirstName: 'jessica taylor, mba', rawCompany: 'NextGen Cloud - Cloud Infrastructure', rawTitle: 'Director of Marketing', email: 'jessica@nextgencloud.ai' },
  { rawFirstName: 'admin', rawCompany: 'CyberNetics Group Ltd', rawTitle: 'Admin Officer', email: 'admin@cybernetics.org' }
];

export default function LeadCleanerTab({ leads, setLeads, onProceedToSequence }: Props) {
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'role' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cleanLeadItems = (items: Partial<Lead>[]) => {
    return items.map((raw, idx) => {
      const rawFirstName = (raw.rawFirstName || raw.cleanFirstName || '').trim();
      const rawCompany = (raw.rawCompany || raw.cleanCompany || '').trim();
      const rawTitle = (raw.rawTitle || raw.cleanTitle || '').trim();
      const email = (raw.email || '').trim();

      const cleanFirstName = sanitizeFirstName(rawFirstName);
      const cleanCompany = sanitizeCompanyName(rawCompany);
      const cleanTitle = sanitizeJobTitle(rawTitle);
      const isRoleEmail = isRoleBasedEmail(email);
      const isValidEmail = isValidEmailFormat(email);
      const slug = createSlug(cleanFirstName, cleanCompany);
      const pitchUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${slug}` : `/p/${slug}`;
      const icebreaker = raw.icebreaker || generateLocalIcebreaker(cleanFirstName || 'there', cleanCompany || 'your company', cleanTitle);

      return {
        id: raw.id || `lead-${Date.now()}-${idx}`,
        rawFirstName,
        rawLastName: raw.rawLastName || '',
        rawCompany,
        rawTitle,
        email,
        cleanFirstName,
        cleanCompany,
        cleanTitle,
        icebreaker,
        isRoleEmail,
        isValidEmail,
        pitchSlug: slug,
        pitchUrl,
        status: (isValidEmail ? 'cleaned' : 'error') as Lead['status']
      };
    });
  };

  const loadSampleData = () => {
    const processed = cleanLeadItems(SAMPLE_DIRTY_DATA);
    setLeads(processed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const parsed: Partial<Lead>[] = rows.map((row) => {
          const findKey = (candidates: string[]) => {
            const key = Object.keys(row).find(k => candidates.some(c => k.toLowerCase().includes(c)));
            return key ? row[key] : '';
          };

          return {
            rawFirstName: findKey(['first', 'name', 'fname', 'contact']) || '',
            rawCompany: findKey(['company', 'organization', 'account', 'business']) || '',
            rawTitle: findKey(['title', 'position', 'role', 'job']) || '',
            email: findKey(['email', 'mail', 'e-mail']) || ''
          };
        });

        const cleaned = cleanLeadItems(parsed);
        setLeads(cleaned);
      }
    });
  };

  const handleDownloadCleanCsv = () => {
    const validLeads = leads.filter(l => l.isValidEmail);
    if (validLeads.length === 0) return;

    const rows = validLeads.map(l => ({
      email: l.email,
      first_name: l.cleanFirstName,
      company: l.cleanCompany,
      title: l.cleanTitle,
      icebreaker: l.icebreaker,
      pitch_page_url: l.pitchUrl,
      is_role_account: l.isRoleEmail ? 'yes' : 'no'
    }));

    const csvContent = Papa.unparse(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xsendflow_cleaned_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    try {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    } catch {
      // Ignore
    }
  };

  const handleCopyIcebreaker = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = searchQuery === '' || 
      l.cleanFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.cleanCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'valid') return l.isValidEmail && !l.isRoleEmail;
    if (filterType === 'role') return l.isRoleEmail;
    if (filterType === 'invalid') return !l.isValidEmail;
    return true;
  });

  const validCount = leads.filter(l => l.isValidEmail && !l.isRoleEmail).length;
  const roleCount = leads.filter(l => l.isRoleEmail).length;
  const invalidCount = leads.filter(l => !l.isValidEmail).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Pillar 1 • Lead Sanitizer &amp; Icebreaker Engine</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Pristine Personalization at Scale
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Strips all-caps formatting, legal entity tags (LLC, Inc.), emojis, and role spam traps (<code className="text-slate-800 font-mono">admin@</code>, <code className="text-slate-800 font-mono">info@</code>) before emails reach your mail server.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSampleData}
            className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl border border-slate-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <span>Load Demo Leads</span>
          </button>
          <label className="cursor-pointer text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 active:scale-95 glow-tag">
            <Upload className="w-4 h-4" />
            <span>Upload Dirty CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Metrics Bar */}
      {leads.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
            <div className="text-2xl font-black text-slate-900 font-mono tnum">{leads.length}</div>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Clean
            </span>
            <div className="text-2xl font-black text-emerald-700 font-mono tnum">{validCount}</div>
          </div>
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Role Spam Traps
            </span>
            <div className="text-2xl font-black text-amber-800 font-mono tnum">{roleCount}</div>
          </div>
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Syntax Errors</span>
            <div className="text-2xl font-black text-rose-700 font-mono tnum">{invalidCount}</div>
          </div>
        </div>
      )}

      {/* Main Table View */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
            <Upload className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">No leads loaded in workspace</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a raw CSV from Apollo, LinkedIn, or Google Maps, or load sample data to test sanitization.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={loadSampleData}
              className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
              Test with 6 Sample Leads →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 px-2 flex items-center gap-1"><Filter className="w-3 h-3" /> Filter:</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All ({leads.length})
              </button>
              <button
                onClick={() => setFilterType('valid')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'valid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Clean ({validCount})
              </button>
              <button
                onClick={() => setFilterType('role')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${filterType === 'role' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Role Traps ({roleCount})
              </button>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-40"
                />
              </div>

              <button
                onClick={handleDownloadCleanCsv}
                className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                title="Download Clean Leads Only CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Export Clean CSV</span>
              </button>

              <button
                onClick={() => setLeads([])}
                className="text-xs text-rose-600 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition-all"
                title="Clear All"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onProceedToSequence}
                className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95"
              >
                <span>Spintax Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold bg-slate-50">
                <tr>
                  <th className="p-3.5">Raw Lead → Cleaned Name</th>
                  <th className="p-3.5">Company → Cleaned</th>
                  <th className="p-3.5">Deliverability Health</th>
                  <th className="p-3.5">AI 1-Sentence Icebreaker</th>
                  <th className="p-3.5">Pitch URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Name */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 text-xs">{lead.cleanFirstName || '—'}</div>
                      <div className="text-[10px] text-slate-400 line-through truncate max-w-[140px] font-mono">{lead.rawFirstName}</div>
                    </td>

                    {/* Company */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800 text-xs">{lead.cleanCompany || '—'}</div>
                      <div className="text-[10px] text-slate-400 line-through truncate max-w-[140px] font-mono">{lead.rawCompany}</div>
                    </td>

                    {/* Email */}
                    <td className="p-3.5">
                      <div className="font-mono text-slate-700 text-[11px]">{lead.email}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {lead.isRoleEmail ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.2 rounded-md font-bold">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Role Trap
                          </span>
                        ) : lead.isValidEmail ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-md font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Clean Lead
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.2 rounded-md font-bold">
                            Invalid Syntax
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Icebreaker */}
                    <td className="p-3.5 max-w-xs">
                      <div className="relative group/ice">
                        <div className="text-slate-700 text-[11px] italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed pr-7">
                          &quot;{lead.icebreaker}&quot;
                        </div>
                        <button
                          onClick={() => handleCopyIcebreaker(lead.id, lead.icebreaker)}
                          className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                          title="Copy Icebreaker"
                        >
                          {copiedId === lead.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Pitch Page Link */}
                    <td className="p-3.5 whitespace-nowrap">
                      <a
                        href={lead.pitchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 w-fit"
                      >
                        /p/{lead.pitchSlug} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
