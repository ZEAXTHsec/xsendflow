'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';
import { X, Download, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lead, SequenceStep, PitchPageConfig } from '@/lib/types';
import { parseSpintax } from '@/lib/spintax';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  sequence: SequenceStep[];
  pitchConfig?: PitchPageConfig;
}

export default function DesktopExportModal({ isOpen, onClose, leads, sequence }: Props) {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const validLeads = (leads || []).filter(l => l && l.email && l.isValidEmail !== false);
  const step1 = (sequence && sequence.length > 0)
    ? (sequence.find(s => s.id === 1) || sequence[0])
    : { id: 1, subject: 'Quick question re: {{Company}}', body: 'Hey {{First_Name}},\n\nWanted to reach out to {{Company}}.' };

  const handleExportCSV = () => {
    // Generate CSV data rows with unique Spintax variation per lead
    const exportRows = (validLeads.length > 0 ? validLeads : (leads || []).filter(l => l && l.email)).map(lead => {
      // 1. Replace variables in step 1 subject & body
      let personalizedSubject = (step1?.subject || '')
        .replace(/\{\{First_Name\}\}/g, lead.cleanFirstName || lead.rawFirstName || '')
        .replace(/\{\{Company\}\}/g, lead.cleanCompany || lead.rawCompany || '')
        .replace(/\{\{Icebreaker\}\}/g, lead.icebreaker || '')
        .replace(/\{\{Pitch_Page_URL\}\}/g, lead.pitchUrl || '');

      let personalizedBody = (step1?.body || '')
        .replace(/\{\{First_Name\}\}/g, lead.cleanFirstName || lead.rawFirstName || '')
        .replace(/\{\{Company\}\}/g, lead.cleanCompany || lead.rawCompany || '')
        .replace(/\{\{Icebreaker\}\}/g, lead.icebreaker || '')
        .replace(/\{\{Pitch_Page_URL\}\}/g, lead.pitchUrl || '');

      // 2. Resolve Spintax choices per recipient for 100% unique cryptographic hashes
      personalizedSubject = parseSpintax(personalizedSubject);
      personalizedBody = parseSpintax(personalizedBody);

      return {
        email: lead.email,
        first_name: lead.cleanFirstName || lead.rawFirstName || '',
        company: lead.cleanCompany || lead.rawCompany || '',
        clean_title: lead.cleanTitle || lead.rawTitle || '',
        icebreaker: lead.icebreaker || '',
        pitch_page_url: lead.pitchUrl || '',
        subject: personalizedSubject,
        body: personalizedBody,
        is_role_account: lead.isRoleEmail ? 'yes' : 'no'
      };
    });

    const csvContent = Papa.unparse(exportRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `xsendflow_campaign_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if canvas confetti is blocked
    }

    setDownloaded(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Export Campaign CSV</h3>
              <p className="text-xs text-slate-500">Universal format compatible with any cold email sender</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Clean Leads</span>
              <div className="text-xl font-black text-emerald-600 font-mono tnum">{validLeads.length}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Pitch Links</span>
              <div className="text-xl font-black text-indigo-600 font-mono tnum">{validLeads.length}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Steps</span>
              <div className="text-xl font-black text-slate-900 font-mono tnum">{sequence.length}</div>
            </div>
          </div>

          {/* Compatibility Breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <span className="font-bold text-slate-800 block">Headers mapped in export file:</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> email</div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> first_name</div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> company</div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> icebreaker</div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> pitch_page_url</div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> personalized_body</div>
            </div>
          </div>

          {/* Action button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleExportCSV}
              disabled={validLeads.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 glow-tag"
            >
              <Download className="w-4 h-4" />
              <span>Download Ready-to-Send Campaign CSV</span>
            </button>

            {downloaded && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>CSV downloaded successfully with unique Spintax hashes! Ready to import into any sending engine.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
