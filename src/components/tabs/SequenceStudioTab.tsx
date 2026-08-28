'use client';

import React, { useState } from 'react';
import { Zap, ShieldCheck, AlertTriangle, Sparkles, RefreshCw, Wand2, ArrowRight, Dices, Layers, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SequenceStep } from '@/lib/types';
import { analyzeSpamRisk, deSpamifyText } from '@/lib/spamWords';
import { autoWrapSpintax } from '@/lib/spintax';
import { calculateSpintaxPermutations, generateSpintaxSamples } from '@/lib/engine/spintaxFSM';

interface Props {
  sequence: SequenceStep[];
  setSequence: React.Dispatch<React.SetStateAction<SequenceStep[]>>;
  onProceedToPitch: () => void;
}

const DEFAULT_SEQUENCE: SequenceStep[] = [
  {
    id: 1,
    day: 1,
    type: 'initial',
    title: 'Step 1: Value Hook & Custom Pitch Link',
    subject: '{{quick question|brief inquiry|intro}} re: {{Company}}',
    body: '{{Hey|Hi}} {{First_Name}},\n\n{{Icebreaker}}\n\n{{Saw what you\'re building at {{Company}} and put together a quick 60-second video roadmap for your team|Noticed {{Company}} is scaling outbound and recorded a tailored breakdown for you}}: {{Pitch_Page_URL}}\n\n{{Open to checking it out?|Worth a quick 5-min chat this week?|Mind if I send over details?}}\n\nBest,\nYour Name',
    spamScore: 100,
    spamWordsFound: []
  },
  {
    id: 2,
    day: 3,
    type: 'followup',
    title: 'Step 2: Case Study & Proof',
    subject: 'Re: quick question re: {{Company}}',
    body: 'Hi {{First_Name}},\n\n{{Wanted to share a quick metric|Quick proof point}}: We recently helped a {{similar B2B team|team in your space}} {{boost inboxing from 42% to 99%|book 28 qualified demos}} in under 14 days.\n\n{{Curious if optimizing outbound deliverability is a focus for {{Company}} right now?|Worth a brief sync this Thursday?}}\n\nBest,\nYour Name',
    spamScore: 100,
    spamWordsFound: []
  },
  {
    id: 3,
    day: 7,
    type: 'nudge',
    title: 'Step 3: Direct 2-Line Nudge',
    subject: 'following up on {{Company}}',
    body: 'Hi {{First_Name}},\n\n{{Any bandwidth to take a look at the custom walkthrough for {{Company}} ({{Pitch_Page_URL}})?|Floating this back to the top of your inbox in case you missed the custom pitch page ({{Pitch_Page_URL}}).}}\n\n{{No pressure either way.|Either way, wishing your team continued growth.}}\n\nBest,\nYour Name',
    spamScore: 100,
    spamWordsFound: []
  },
  {
    id: 4,
    day: 12,
    type: 'breakup',
    title: 'Step 4: Graceful Breakup',
    subject: 'closing the loop on {{Company}}',
    body: 'Hi {{First_Name}},\n\n{{Assuming scaling outbound isn\'t a priority for {{Company}} right now, so I won\'t follow up again.|Closing the loop here as I don\'t want to clutter your inbox.}}\n\n{{If anything changes down the line, feel free to reach back out.|Wishing you and {{Company}} all the best.}}\n\nBest,\nYour Name',
    spamScore: 100,
    spamWordsFound: []
  }
];

export default function SequenceStudioTab({ sequence, setSequence, onProceedToPitch }: Props) {
  const [activeStepId, setActiveStepId] = useState<number>(1);
  const [selectedFramework, setSelectedFramework] = useState<'video_pitch' | 'provocative' | 'case_study' | 'founder_intro'>('video_pitch');
  const [offer, setOffer] = useState('');
  const [audience, setAudience] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [spintaxSamples, setSpintaxSamples] = useState<string[]>([]);
  const [subjectVariant, setSubjectVariant] = useState<'A' | 'B'>('A');
  const [subjectB, setSubjectB] = useState<Record<number, string>>({
    1: '{{intro|quick question}} for {{First_Name}}',
    2: '{{Company}} deliverability follow up',
    3: 'checking in re: {{Company}}',
    4: 'permission to close file on {{Company}}'
  });
  const [copiedSampleIdx, setCopiedSampleIdx] = useState<number | null>(null);

  const activeStep = sequence.find(s => s.id === activeStepId) || sequence[0] || DEFAULT_SEQUENCE[0];
  const fullText = `${activeStep.subject} ${activeStep.body}`;
  const permutationCount = calculateSpintaxPermutations(fullText);

  const handleUpdateStep = (updatedSubject: string, updatedBody: string) => {
    const combinedText = `${updatedSubject} ${updatedBody}`;
    const analysis = analyzeSpamRisk(combinedText);

    setSequence(prev =>
      prev.map(step =>
        step.id === activeStep.id
          ? {
              ...step,
              subject: updatedSubject,
              body: updatedBody,
              spamScore: analysis.score,
              spamWordsFound: analysis.wordsFound
            }
          : step
      )
    );
  };

  const handleDeSpamify = () => {
    const { cleanedText: cleanSub } = deSpamifyText(activeStep.subject);
    const { cleanedText: cleanBody } = deSpamifyText(activeStep.body);
    handleUpdateStep(cleanSub, cleanBody);
    try { confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } }); } catch {}
  };

  const handleAutoSpintax = () => {
    const spintaxSub = autoWrapSpintax(activeStep.subject);
    const spintaxBody = autoWrapSpintax(activeStep.body);
    handleUpdateStep(spintaxSub, spintaxBody);
    try { confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } }); } catch {}
  };

  const handleGenerateSpintaxSamples = () => {
    const samples = generateSpintaxSamples(activeStep.body, 4);
    setSpintaxSamples(samples);
  };

  const handleGenerateAISequence = async () => {
    setIsGenerating(true);
    try {
      const apiKey = typeof window !== 'undefined' ? localStorage.getItem('xsendflow_gemini_key') || '' : '';
      const res = await fetch('/api/ai/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: offer || 'automated cold email deliverability engine',
          audience: audience || 'B2B founders & growth leaders',
          painPoint: painPoint || 'spam placement and low response rates',
          framework: selectedFramework,
          apiKey
        })
      });
      const data = await res.json();
      if (data.sequence) {
        setSequence(data.sequence);
        try { confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } }); } catch {}
      }
    } catch (e) {
      console.error('Sequence generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySample = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSampleIdx(idx);
    setTimeout(() => setCopiedSampleIdx(null), 2000);
  };

  const subjectLength = activeStep.subject.length;
  const isOptimalLength = subjectLength >= 15 && subjectLength <= 50;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pillar 3 • Anti-AI-Slop Sequence &amp; Spintax Studio</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Psychological Cold Pitching &amp; Cryptographic Spintax
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Generate punchy, human-sounding cold emails under 60 words. Powered by Google Gemini 2.0 Flash, deep finite-state spintax, and real-time spam keyword filters.
          </p>
        </div>

        <button
          onClick={onProceedToPitch}
          className="text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 active:scale-95 glow-tag shrink-0"
        >
          <span>Proceed to Pitch Pages</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ═══ 7-FIGURE COPYWRITING FRAMEWORK GENERATOR ═══ */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Figure Outbound Copywriting Generator</h3>
              <p className="text-[11px] text-slate-500">Bespoke, peer-to-peer sequences designed to bypass AI detection &amp; get replies</p>
            </div>
          </div>

          {/* Copywriting Framework Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setSelectedFramework('video_pitch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFramework === 'video_pitch' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📹 1-to-1 Video Pitch
            </button>
            <button
              onClick={() => setSelectedFramework('provocative')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFramework === 'provocative' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚡ 3-Sentence Hook
            </button>
            <button
              onClick={() => setSelectedFramework('case_study')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFramework === 'case_study' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Metric Proof
            </button>
            <button
              onClick={() => setSelectedFramework('founder_intro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedFramework === 'founder_intro' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🤝 Founder Intro
            </button>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Your Service / Offer</label>
            <input
              type="text"
              placeholder="e.g. 99% cold email deliverability infrastructure"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Target Niche / Audience</label>
            <input
              type="text"
              placeholder="e.g. B2B founders &amp; Outbound agency owners"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Core Bottleneck / Pain Point</label>
            <input
              type="text"
              placeholder="e.g. emails landing in spam &amp; low response rates"
              value={painPoint}
              onChange={(e) => setPainPoint(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-3 border-t border-slate-100">
          <span className="text-[11px] text-slate-500">
            Powered by <strong>Google Gemini 2.0 Flash</strong> • Generates 4-step sequence with finite-state spintax
          </span>
          <button
            onClick={handleGenerateAISequence}
            disabled={isGenerating}
            className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 glow-tag shrink-0"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            <span>Generate High-Converting Sequence</span>
          </button>
        </div>
      </div>

      {/* ═══ SEQUENCE EDITOR & SPINTAX MATRIX ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sequence Timeline</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              4 Steps Configured
            </span>
          </div>

          {sequence.map((step) => {
            const isSelected = step.id === activeStep.id;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full font-mono border border-slate-200 font-bold">
                    Day {step.day}
                  </span>
                </div>

                <p className="text-xs text-slate-500 truncate font-mono text-[11px]">
                  {step.subject}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Deliverability:</span>
                    <span className={`font-black font-mono ${step.spamScore >= 90 ? 'text-emerald-600' : step.spamScore >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {step.spamScore}%
                    </span>
                  </div>

                  {step.spamWordsFound.length > 0 && (
                    <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.2 rounded font-bold">
                      {step.spamWordsFound.length} trigger(s)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Editor & Spintax Inspector Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            {/* Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{activeStep.title}</h3>
                  <span className="text-[11px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{permutationCount > 1 ? `${permutationCount.toLocaleString()} Permutations` : '1 Unique Variant'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tags: <code className="text-indigo-600 font-mono font-bold">{'{{First_Name}}'}</code>, <code className="text-indigo-600 font-mono font-bold">{'{{Company}}'}</code>, <code className="text-indigo-600 font-mono font-bold">{'{{Pitch_Page_URL}}'}</code>, <code className="text-indigo-600 font-mono font-bold">{'{{Icebreaker}}'}</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeSpamify}
                  className="text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> De-Spamify
                </button>

                <button
                  onClick={handleAutoSpintax}
                  className="text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-600" /> Auto-Spintax
                </button>

                <button
                  onClick={handleGenerateSpintaxSamples}
                  className="text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-95 glow-tag"
                >
                  <Dices className="w-3.5 h-3.5" /> Spin &amp; Preview
                </button>
              </div>
            </div>

            {/* A/B Subject Line Split Tester */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Subject Line</label>
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px] font-bold">
                    <button
                      onClick={() => setSubjectVariant('A')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        subjectVariant === 'A' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Variant A (Primary)
                    </button>
                    <button
                      onClick={() => setSubjectVariant('B')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        subjectVariant === 'B' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Variant B (Split Test)
                    </button>
                  </div>
                </div>

                <span className={`text-[11px] font-mono font-bold ${isOptimalLength ? 'text-emerald-600' : 'text-amber-700'}`}>
                  {activeStep.subject.length} chars ({isOptimalLength ? 'Optimal' : 'Aim 15–50'})
                </span>
              </div>

              {subjectVariant === 'A' ? (
                <input
                  type="text"
                  value={activeStep.subject}
                  onChange={(e) => handleUpdateStep(e.target.value, activeStep.body)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <input
                  type="text"
                  value={subjectB[activeStep.id] || ''}
                  onChange={(e) => setSubjectB({ ...subjectB, [activeStep.id]: e.target.value })}
                  placeholder="Enter alternative subject variant for 50/50 split testing..."
                  className="w-full bg-purple-50/50 border border-purple-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono font-semibold focus:outline-none focus:border-purple-500"
                />
              )}
            </div>

            {/* Email Body Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Email Body (Deep Nested Spintax Enabled)</label>
                <span className="text-[11px] font-mono text-slate-500">
                  {activeStep.body.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={9}
                value={activeStep.body}
                onChange={(e) => handleUpdateStep(activeStep.subject, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-900 font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Spam Trigger Alert Box */}
            {activeStep.spamWordsFound.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-900">
                    Spam trigger words detected: ({activeStep.spamWordsFound.join(', ')})
                  </div>
                  <p className="text-[11px] text-rose-700 leading-normal">
                    These keywords trigger Google &amp; Outlook filters. Click &quot;De-Spamify&quot; to rewrite them into clean business wording.
                  </p>
                </div>
              </div>
            )}

            {/* ═══ SPINTAX SAMPLE VARIATION PREVIEW ═══ */}
            {spintaxSamples.length > 0 && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-purple-800">
                  <span className="flex items-center gap-1.5">
                    <Dices className="w-4 h-4 text-purple-600" />
                    <span>Live Randomized Spintax Permutation Samples:</span>
                  </span>
                  <button onClick={() => setSpintaxSamples([])} className="text-slate-500 hover:text-slate-800 text-[11px]">
                    Dismiss ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {spintaxSamples.map((sample, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-purple-700 border-b border-slate-100 pb-1.5">
                        <span>Permutation #{idx + 1}</span>
                        <button
                          onClick={() => handleCopySample(sample, idx)}
                          className="text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                        >
                          {copiedSampleIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSampleIdx === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed whitespace-pre-line text-slate-700 font-sans">
                        {sample}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
