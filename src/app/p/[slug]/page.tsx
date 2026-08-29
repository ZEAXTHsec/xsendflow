import { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const company = (sp.company as string) || slug.split('-')[0] || 'Your Team';
  const name = (sp.name as string) || slug.split('-')[1] || 'Partner';
  
  return {
    title: `Exclusive Walkthrough for ${name} at ${company} | XSendFlow`,
    description: `Personalized 60-second growth and deliverability walkthrough prepared for ${company}.`,
  };
}

function formatEmbedUrl(url: string): string {
  if (!url) return 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0';
  if (url.includes('loom.com/share/')) {
    return url.replace('loom.com/share/', 'loom.com/embed/');
  }
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

export default async function PitchPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  // Infer details from query params or slug
  const parts = slug.split('-');
  const rawCompany = (sp.company as string) || parts[0] || 'Your Company';
  const rawName = (sp.name as string) || parts[1] || 'there';
  const rawTitle = (sp.title as string) || 'Growth Leader';
  const rawVideo = (sp.video as string) || '';
  const videoUrl = formatEmbedUrl(rawVideo);
  const calendarUrl = (sp.cal as string) || 'https://cal.com';

  const company = rawCompany.charAt(0).toUpperCase() + rawCompany.slice(1);
  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
              X
            </div>
            <span className="font-bold tracking-tight text-slate-900">XSendFlow</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-mono font-bold">
              1-to-1 Custom Deck
            </span>
          </div>

          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95"
          >
            Book 15-Min Intro Call →
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Private Walkthrough for <strong className="text-slate-950 font-bold">{company}</strong>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-tight">
            How {company} Can Scale Inbound Meetings Without Hitting Spam Filters
          </h1>

          <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Hey <span className="text-slate-900 font-bold">{name}</span>, rather than sending a generic pitch, our team put together this dedicated 60-second video and blueprint specifically for your role as {rawTitle}.
          </p>
        </div>

        {/* Video / Demo Showcase */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl p-3 sm:p-5">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center relative shadow-inner">
            <iframe
              src={videoUrl}
              title={`Custom Walkthrough for ${company}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>⚡ Recorded specifically for {company}</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verified Delivery
            </span>
          </div>
        </div>

        {/* 3 Core Value Pillars tailored for Prospect */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight text-center sm:text-left">
            Why this moves the needle for {company}:
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-2 hover:shadow-lg transition-all shadow-xs">
              <div className="text-emerald-700 font-mono text-sm font-bold">01. 100% Inboxing</div>
              <h3 className="font-bold text-slate-900 text-base">Zero DNS &amp; Spam Penalties</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated SPF, DKIM, and DMARC alignment protects {company}&apos;s main domain reputation forever.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-2 hover:shadow-lg transition-all shadow-xs">
              <div className="text-blue-700 font-mono text-sm font-bold">02. Spintax Variations</div>
              <h3 className="font-bold text-slate-900 text-base">Zero Template Repetition</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every outreach email sent has a unique cryptographic hash, bypassing Google &amp; Outlook spam radars.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-2 hover:shadow-lg transition-all shadow-xs">
              <div className="text-purple-700 font-mono text-sm font-bold">03. 10x Reply Rate</div>
              <h3 className="font-bold text-slate-900 text-base">Hyper-Relevant First Lines</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Custom icebreakers and 1-to-1 pitch pages prove to prospects that your message was handwritten.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Booking Section */}
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-b from-blue-50/80 to-indigo-50/80 p-8 text-center space-y-6 shadow-sm">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Ready to explore this for {company}?
            </h2>
            <p className="text-slate-600 text-sm">
              Grab a casual 15-minute slot below. No hard pitch—just a transparent look at how this plugs directly into your existing workflow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20 active:scale-95 glow-tag"
            >
              Select a Time on My Calendar →
            </a>
            <a
              href="mailto:contact@xsendflow.com"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl text-sm border border-slate-200 transition-all shadow-xs"
            >
              Reply via Email Instead
            </a>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Prepared securely via XSendFlow Dynamic Pitch Engine • All rights reserved</p>
      </footer>
    </div>
  );
}
