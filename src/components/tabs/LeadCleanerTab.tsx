'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  UploadCloud, Sparkles, AlertTriangle, CheckCircle2, Trash2, 
  Filter, ArrowRight, Copy, Check, Search, ShieldCheck, Download, 
  FileText, Plus, RefreshCw, Zap, Users, ExternalLink, Mail, CheckCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead } from '@/lib/types';
import { sanitizeFirstName, sanitizeCompanyName, sanitizeJobTitle, isRoleBasedEmail, isValidEmailFormat, generateLocalIcebreaker, createSlug } from '@/lib/sanitizer';

interface Props {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  onProceedToSequence: () => void;
}

const SAMPLE_B2B_LEADS: Partial<Lead>[] = [
  { rawFirstName: 'DR. ROBERT SMITH JR. (CEO)', rawCompany: 'Acme Solutions LLC Inc.', rawTitle: 'Chief Growth Officer & AI Strategist', email: 'robert@acmesolutions.com' },
  { rawFirstName: 'sarah (hiring 10+ devs)', rawCompany: 'STRIPE PAYMENTS CORP', rawTitle: 'Head of Developer Experience', email: 'sarah.j@stripe.com' },
  { rawFirstName: 'MICHAEL O\'CONNOR [Founder]', rawCompany: 'DataFlow Systems Pvt Ltd.', rawTitle: 'VP of Engineering / Co-Founder', email: 'moconnor@dataflow.io' },
  { rawFirstName: 'support team', rawCompany: 'Generic Retail Store Co.', rawTitle: 'Customer Support Rep', email: 'support@genericretail.com' },
  { rawFirstName: 'jessica taylor, mba', rawCompany: 'NextGen Cloud - Infrastructure', rawTitle: 'Director of Marketing', email: 'jessica@nextgencloud.ai' },
  { rawFirstName: 'admin', rawCompany: 'CyberNetics Group Ltd', rawTitle: 'Admin Officer', email: 'admin@cybernetics.org' }
];

export default function LeadCleanerTab({ leads, setLeads, onProceedToSequence }: Props) {
  const [filterType, setFilterType] = useState<'all' | 'valid' | 'role' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isPasting, setIsPasting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const cleanLeadItems = (items: Partial<Lead>[]): Lead[] => {
    return items.map((raw, idx) => {
      let rawFirstName = (raw.rawFirstName || raw.cleanFirstName || '').trim();
      let rawCompany = (raw.rawCompany || raw.cleanCompany || '').trim();
      let rawTitle = (raw.rawTitle || raw.cleanTitle || '').trim();
      let email = (raw.email || '').trim().toLowerCase();

      // Fix common typos in email domains
      email = email
        .replace(/@gmai\.com$/i, '@gmail.com')
        .replace(/@yaho\.com$/i, '@yahoo.com')
        .replace(/@hotmial\.com$/i, '@hotmail.com')
        .replace(/@outlok\.com$/i, '@outlook.com');

      const cleanFirstName = sanitizeFirstName(rawFirstName);
      const cleanCompany = sanitizeCompanyName(rawCompany);
      const cleanTitle = sanitizeJobTitle(rawTitle);
      const isRoleEmail = isRoleBasedEmail(email);
      const isValidEmail = isValidEmailFormat(email);
      const slug = createSlug(cleanFirstName, cleanCompany);
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://xsendflow.com';
      const pitchUrl = `${appUrl}/p/${slug}?name=${encodeURIComponent(cleanFirstName)}&company=${encodeURIComponent(cleanCompany)}&title=${encodeURIComponent(cleanTitle || 'Growth Leader')}`;
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
        status: (isValidEmail && !isRoleEmail ? 'cleaned' : isRoleEmail ? 'flagged' : 'error') as Lead['status']
      };
    });
  };

  const handleLoadSamples = () => {
    const cleaned = cleanLeadItems(SAMPLE_B2B_LEADS);
    setLeads(cleaned);
    try { confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } }); } catch {}
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
            rawCompany: findKey(['company', 'organization', 'account', 'business', 'org']) || '',
            rawTitle: findKey(['title', 'position', 'role', 'job']) || '',
            email: findKey(['email', 'mail', 'e-mail']) || ''
          };
        }).filter(r => r.email);

        const cleaned = cleanLeadItems(parsed);
        setLeads([...cleaned, ...leads]);
        try { confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } }); } catch {}
      }
    });
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    try {
      const parsed = Papa.parse(pastedText.trim(), { header: true, skipEmptyLines: true });
      let rows = parsed.data as Record<string, string>[];

      // Fallback: If header parsing yielded 0 rows or single line, parse line-by-line
      if (!rows.length || !rows[0] || Object.keys(rows[0]).length <= 1) {
        const lines = pastedText.split('\n').filter(l => l.trim());
        rows = lines.map(line => {
          const parts = line.split(/[,\t|]/).map(p => p.trim());
          return {
            email: parts.find(p => p.includes('@')) || '',
            first: parts[0] && !parts[0].includes('@') ? parts[0] : '',
            company: parts[1] && !parts[1].includes('@') ? parts[1] : '',
            title: parts[2] || ''
          };
        });
      }

      const items: Partial<Lead>[] = rows.map(r => {
        const headers = Object.keys(r);
        const findVal = (terms: string[]) => {
          const found = headers.find(h => terms.some(t => h.toLowerCase().includes(t)));
          return found ? r[found] : '';
        };

        return {
          rawFirstName: findVal(['first', 'name', 'fname']) || r.first || '',
          rawCompany: findVal(['company', 'org', 'account']) || r.company || '',
          rawTitle: findVal(['title', 'role']) || r.title || '',
          email: findVal(['email', 'mail']) || r.email || ''
        };
      }).filter(i => i.email && i.email.includes('@'));

      const cleaned = cleanLeadItems(items);
      setLeads([...cleaned, ...leads]);
      setPastedText('');
      setIsPasting(false);
      try { confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } }); } catch {}
    } catch {
      alert('Could not parse pasted data. Ensure comma or tab separated format.');
    }
  };

  const handleGenerateAiIcebreakers = async () => {
    if (!leads.length) return;
    setIsGeneratingAi(true);
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_gemini_key') || '' : '';
      const sampleBatch = leads.slice(0, 10);

      const res = await fetch('/api/ai/clean-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: sampleBatch.map(l => ({
            name: l.cleanFirstName,
            company: l.cleanCompany,
            title: l.cleanTitle,
            email: l.email
          })),
          apiKey
        })
      });

      const data = await res.json();
      if (data.cleanedLeads && Array.isArray(data.cleanedLeads)) {
        const icebreakerMap = new Map<string, string>(
          data.cleanedLeads.map((c: any) => [String(c.email || ''), String(c.icebreaker || '')])
        );
        setLeads(prev => prev.map(lead => ({
          ...lead,
          icebreaker: (icebreakerMap.get(lead.email) || lead.icebreaker || '') as string
        })));
        try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } }); } catch {}
      }
    } catch (err) {
      console.error('AI Icebreaker error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownloadCleanCsv = () => {
    if (!leads.length) return;
    const csvData = leads.map(l => ({
      'First Name': l.cleanFirstName,
      'Company': l.cleanCompany,
      'Title': l.cleanTitle,
      'Email': l.email,
      'Status': l.isValidEmail ? (l.isRoleEmail ? 'Role-Based' : 'Verified Valid') : 'Invalid Syntax',
      'AI Icebreaker': l.icebreaker,
      'Pitch Page URL': l.pitchUrl
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xsendflow-verified-leads-${Date.now()}.csv`;
    link.click();
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Clear all contacts from Lead Database?')) {
      setLeads([]);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.cleanFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.cleanCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'valid') return lead.isValidEmail && !lead.isRoleEmail;
    if (filterType === 'role') return lead.isRoleEmail;
    if (filterType === 'invalid') return !lead.isValidEmail;
    return true;
  });

  const validCount = leads.filter(l => l.isValidEmail && !l.isRoleEmail).length;
  const roleCount = leads.filter(l => l.isRoleEmail).length;
  const invalidCount = leads.filter(l => !l.isValidEmail).length;

  return (
    <div className="space-y-8">
      {/* 1. EXECUTIVE HERO COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0b101b] border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>RFC 5322 Syntax &amp; MX Guard Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Icebreaker Enrichment</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Lead Database &amp; Sanitizer Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Scrub spam traps, fix typos, strip formal company junk (&quot;LLC Inc.&quot;), and generate 1-to-1 personalized AI hooks before importing to campaigns.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onProceedToSequence()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>Push to Campaign Wizard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadCleanCsv}
              disabled={!leads.length}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 font-bold text-xs px-4 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. IMPORT OPTIONS & INGESTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: File Drop */}
        <label className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4">
          <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">Upload CSV / Spreadsheet</h2>
            <p className="text-xs text-slate-500">Auto-detects names, emails, companies, and roles.</p>
          </div>
          <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Browse CSV File →</span>
          </div>
        </label>

        {/* Card 2: Paste Rows */}
        <div 
          onClick={() => setIsPasting(!isPasting)}
          className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">Direct Paste (Excel/Sheets)</h2>
            <p className="text-xs text-slate-500">Paste raw rows directly without exporting files.</p>
          </div>
          <div className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>{isPasting ? 'Close Paste Box' : 'Open Paste Box →'}</span>
          </div>
        </div>

        {/* Card 3: Preloaded Sample */}
        <div 
          onClick={handleLoadSamples}
          className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group space-y-4"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">Load Dirty B2B Sample</h2>
            <p className="text-xs text-slate-500">Inspect real-time syntax cleaning &amp; icebreakers.</p>
          </div>
          <div className="text-xs font-bold text-purple-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Load 6 Test Leads →</span>
          </div>
        </div>
      </div>

      {/* Paste Box Drawer */}
      {isPasting && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white">Paste Raw Contact Rows</h3>
              <p className="text-xs text-slate-400">Comma-separated or Tab-separated (e.g. &quot;John, Stripe, VP Growth, john@stripe.com&quot;)</p>
            </div>
            <button
              onClick={() => setIsPasting(false)}
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <textarea
            rows={4}
            value={pastedText}
            onChange={e => setPastedText(e.target.value)}
            placeholder="John, Stripe, VP Growth, john@stripe.com&#10;Sarah, Datadog, Head of Dev, sarah@datadog.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />

          <div className="flex justify-end">
            <button
              onClick={handleParsePastedText}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all"
            >
              Parse &amp; Clean Leads
            </button>
          </div>
        </div>
      )}

      {/* 3. METRIC TILES & FILTER CONTROLS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Leads ({leads.length})
            </button>

            <button
              onClick={() => setFilterType('valid')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === 'valid' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verified Valid ({validCount})</span>
            </button>

            <button
              onClick={() => setFilterType('role')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterType === 'role' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Role-Based Flag ({roleCount})</span>
            </button>

            {invalidCount > 0 && (
              <button
                onClick={() => setFilterType('invalid')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterType === 'invalid' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Invalid Syntax ({invalidCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
              />
            </div>

            {leads.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold p-2 hover:bg-rose-50 rounded-xl transition-colors"
                title="Clear all leads"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Lead Table */}
        {filteredLeads.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No leads in this view</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload a CSV file, paste rows from Google Sheets, or load the preloaded sample list above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-3">Prospect &amp; Company</th>
                  <th className="py-3 px-3">Cleaned Email</th>
                  <th className="py-3 px-3">Deliverability Status</th>
                  <th className="py-3 px-3">AI 1-Line Icebreaker</th>
                  <th className="py-3 px-3">Pitch Route</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-900">{lead.cleanFirstName}</div>
                      <div className="text-[11px] text-slate-500">{lead.cleanCompany} • <span className="italic">{lead.cleanTitle || 'Decision Maker'}</span></div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800">
                      {lead.email}
                    </td>
                    <td className="py-3 px-3">
                      {lead.isValidEmail && !lead.isRoleEmail && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>VALID</span>
                        </span>
                      )}
                      {lead.isRoleEmail && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>ROLE-BASED</span>
                        </span>
                      )}
                      {!lead.isValidEmail && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold font-mono">
                          <span>SYNTAX ERROR</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-xs text-slate-600 text-[11px] truncate">
                      {lead.icebreaker}
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={lead.pitchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 font-mono text-[11px] flex items-center gap-1"
                      >
                        <span>/p/{lead.pitchSlug}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
