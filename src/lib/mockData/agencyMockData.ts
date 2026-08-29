import { Campaign } from '@/components/tabs/CampaignsTab';
import { SenderAccount } from '@/components/tabs/SendersTab';

export type { SenderAccount };

export const AGENCY_MOCK_SENDERS: SenderAccount[] = [
  {
    id: 'sender-agency-1',
    email: 'alex.turner@agencygrowth.io',
    label: 'Alex Turner (Primary Founder)',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'alex.turner@agencygrowth.io',
    smtpPass: '••••••••••••••••',
    dailyLimit: 120,
    dailySentCount: 84,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'sender-agency-2',
    email: 'sarah.jenkins@scaleflow.ai',
    label: 'Sarah Jenkins (VP Growth)',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'sarah.jenkins@scaleflow.ai',
    smtpPass: '••••••••••••••••',
    dailyLimit: 120,
    dailySentCount: 68,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString()
  },
  {
    id: 'sender-agency-3',
    email: 'partnerships@outboundscale.co',
    label: 'Partnerships Fleet Relay',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpUser: 'partnerships@outboundscale.co',
    smtpPass: '••••••••••••••••',
    dailyLimit: 150,
    dailySentCount: 112,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'sender-agency-4',
    email: 'growth@xsendflow.com',
    label: 'XSendFlow Dedicated Cloud Relay',
    smtpHost: 'smtp.xsendflow.com',
    smtpPort: 587,
    smtpUser: 'growth@xsendflow.com',
    smtpPass: '••••••••••••••••',
    dailyLimit: 200,
    dailySentCount: 140,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
  }
];

export function getAgencyMockCampaigns(origin = 'http://localhost:3000'): Campaign[] {
  // 1. Active 24/7 Campaign
  const activeRecipients = [];
  const names = ['David Chen', 'Elena Vance', 'Marcus Miller', 'Aiko Tanaka', 'Michael Rao', 'Chloe Dubois', 'Liam Patel', 'Sophia Kowalski', 'Noah Smith', 'Maya Taylor'];
  const comps = ['ApexScale', 'HyperGrowth AI', 'CloudSphere', 'VentureForge', 'NextEra Tech', 'InboundPulse', 'CyberShield', 'DataWave', 'OmniFlow', 'Acuity SaaS'];

  for (let i = 1; i <= 60; i++) {
    const fn = names[i % names.length].split(' ')[0];
    const comp = comps[i % comps.length];
    const isSent = i <= 42;
    const isOpened = i <= 24;
    const isReplied = i === 3 || i === 9 || i === 18 || i === 27;

    activeRecipients.push({
      id: `act-${i}`,
      email: `${fn.toLowerCase()}.${i}@${comp.toLowerCase()}.io`,
      firstName: fn,
      company: comp,
      title: 'Founder & CEO',
      website: `https://${comp.toLowerCase()}.io`,
      icebreaker: `Noticed ${comp}'s impressive growth trajectory in modern AI outbound.`,
      pitchUrl: `${origin}/p/${comp.toLowerCase()}-${fn.toLowerCase()}`,
      status: isReplied ? 'replied' as const : isOpened ? 'opened' as const : isSent ? 'sent' as const : 'pending' as const,
      sentAt: isSent ? `10:${String(10 + (i % 45)).padStart(2, '0')} AM` : undefined
    });
  }

  // 2. Scheduled Campaign
  const scheduledRecipients = [];
  for (let i = 1; i <= 40; i++) {
    const fn = names[(i * 3) % names.length].split(' ')[0];
    const comp = comps[(i * 2) % comps.length];
    scheduledRecipients.push({
      id: `sched-${i}`,
      email: `${fn.toLowerCase()}.${i}@${comp.toLowerCase()}.co.uk`,
      firstName: fn,
      company: comp,
      title: 'Head of Growth',
      website: `https://${comp.toLowerCase()}.co.uk`,
      icebreaker: `Saw your presentation at the European Tech Scaling Summit.`,
      pitchUrl: `${origin}/p/${comp.toLowerCase()}-${fn.toLowerCase()}`,
      status: 'pending' as const
    });
  }

  // 3. Completed Campaign
  const doneRecipients = [];
  for (let i = 1; i <= 30; i++) {
    const fn = names[(i * 7) % names.length].split(' ')[0];
    const comp = comps[(i * 5) % comps.length];
    const isOpened = i <= 22;
    const isReplied = i === 2 || i === 7 || i === 12 || i === 20 || i === 28;
    doneRecipients.push({
      id: `done-${i}`,
      email: `${fn.toLowerCase()}.${i}@${comp.toLowerCase()}.com`,
      firstName: fn,
      company: comp,
      title: 'Managing Director',
      website: `https://${comp.toLowerCase()}.com`,
      icebreaker: `Loved ${comp}'s recent case study on enterprise scale.`,
      pitchUrl: `${origin}/p/${comp.toLowerCase()}-${fn.toLowerCase()}`,
      status: isReplied ? 'replied' as const : isOpened ? 'opened' as const : 'sent' as const,
      sentAt: `09:${String(15 + (i % 40)).padStart(2, '0')} AM`
    });
  }

  return [
    {
      id: 'camp-agency-active-1',
      name: '⚡ Global SaaS Founders & CTOs Scale',
      fromName: 'Alex Turner',
      senderId: 'sender-agency-1',
      selectedSenderIds: ['sender-agency-1', 'sender-agency-2', 'sender-agency-3', 'sender-agency-4'],
      delaySeconds: 45,
      dailyLimit: 250,
      windowStart: '00:00',
      windowEnd: '23:59',
      timezone: 'America/New_York (EST)',
      is24Hours: true,
      status: 'in_progress',
      trackOpens: true,
      trackClicks: true,
      includeUnsubscribe: true,
      unsubscribeText: 'PS: If you would rather not hear from me, reply stop and I will remove you right away.',
      steps: [
        {
          id: 1,
          dayDelay: 0,
          subject: '{Quick question|Brief intro} re: {{Company}} outbound scaling',
          body: 'Hey {{First_Name}},\n\n{{Icebreaker}}\n\nReached out because we help B2B teams scale their cold outbound pipeline to 99% inbox placement with deep Spintax and zero spam traps.\n\nPut together a custom 60-second video walkthrough tailored specifically for {{Company}} here: {{Pitch_Page_URL}}\n\nWorth a quick 5-minute chat this week?\n\nBest,\nAlex Turner'
        },
        {
          id: 2,
          dayDelay: 3,
          subject: 'Re: quick question re: {{Company}}',
          body: 'Hi {{First_Name}},\n\nWanted to float this back to the top of your inbox. Did you get a chance to take a look at the custom walkthrough for {{Company}} ({{Pitch_Page_URL}})?\n\nBest,\nAlex'
        }
      ],
      recipients: activeRecipients,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'camp-agency-scheduled-2',
      name: '🇬🇧 Enterprise Fintech Outreach (UK & Europe)',
      fromName: 'Sarah Jenkins',
      senderId: 'sender-agency-2',
      selectedSenderIds: ['sender-agency-2', 'sender-agency-4'],
      delaySeconds: 60,
      dailyLimit: 150,
      windowStart: '09:00',
      windowEnd: '17:30',
      timezone: 'Europe/London (GMT)',
      is24Hours: false,
      status: 'scheduled',
      trackOpens: true,
      trackClicks: true,
      includeUnsubscribe: true,
      unsubscribeText: "Reply 'STOP' to unsubscribe.",
      steps: [
        {
          id: 1,
          dayDelay: 0,
          subject: 'Optimizing {{Company}}\'s growth infrastructure',
          body: 'Hello {{First_Name}},\n\n{{Icebreaker}}\n\nCurious if optimizing your delivery rates and outbound automation is a priority for {{Company}} this quarter?\n\nWe prepared a custom benchmark for your domain here: {{Pitch_Page_URL}}\n\nKind regards,\nSarah Jenkins'
        }
      ],
      recipients: scheduledRecipients,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'camp-agency-done-3',
      name: '🚀 Q3 Y-Combinator & Seed AI Growth Leaders',
      fromName: 'Alex Turner',
      senderId: 'sender-agency-1',
      selectedSenderIds: ['sender-agency-1', 'sender-agency-3'],
      delaySeconds: 45,
      dailyLimit: 200,
      windowStart: '09:00',
      windowEnd: '17:00',
      timezone: 'America/Los_Angeles (PST)',
      is24Hours: false,
      status: 'done',
      trackOpens: true,
      trackClicks: true,
      includeUnsubscribe: true,
      unsubscribeText: 'PS: Let me know if you would like me to remove your address.',
      steps: [
        {
          id: 1,
          dayDelay: 0,
          subject: 'Idea for {{Company}}\'s cold outbound pipeline',
          body: 'Hey {{First_Name}},\n\n{{Icebreaker}}\n\nCustom deck prepared for {{Company}}: {{Pitch_Page_URL}}\n\nBest,\nAlex'
        }
      ],
      recipients: doneRecipients,
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
    }
  ];
}

export function getHighVolumeMockCampaigns(count = 100, origin = 'http://localhost:3000'): Campaign[] {
  const industries = ['Fintech & Payments', 'GenAI SaaS', 'Healthcare & Biotech', 'Cybersecurity Ops', 'Cloud Logistics', 'EdTech Scale', 'DevOps & Infra', 'B2B MarTech', 'PropTech Real Estate', 'Autonomous Robotics'];
  const locations = ['New York (EST)', 'San Francisco (PST)', 'London (GMT)', 'Singapore (SGT)', 'Berlin (CET)', 'Toronto (EST)', 'Tokyo (JST)', 'Sydney (AEST)'];
  const tzMap: Record<string, string> = {
    'New York (EST)': 'America/New_York (EST)',
    'San Francisco (PST)': 'America/Los_Angeles (PST)',
    'London (GMT)': 'Europe/London (GMT)',
    'Singapore (SGT)': 'Asia/Singapore (SGT)',
    'Berlin (CET)': 'Europe/Berlin (CET)',
    'Toronto (EST)': 'America/Toronto (EST)',
    'Tokyo (JST)': 'Asia/Tokyo (JST)',
    'Sydney (AEST)': 'Australia/Sydney (AEST)'
  };
  const senders = ['sender-agency-1', 'sender-agency-2', 'sender-agency-3', 'sender-agency-4'];

  const campaigns: Campaign[] = [];

  for (let i = 1; i <= count; i++) {
    const ind = industries[(i - 1) % industries.length];
    const loc = locations[(i - 1) % locations.length];
    const tz = tzMap[loc] || 'America/New_York (EST)';
    const is24h = i % 5 === 0;
    
    // Status distribution: 40% active/sending, 30% scheduled, 20% done, 10% paused
    const statusVal = (i % 10 < 4) ? 'in_progress' : (i % 10 < 7) ? 'scheduled' : (i % 10 < 9) ? 'done' : 'paused';
    
    const leadCount = 20 + ((i * 7) % 80);
    const recipients = [];
    for (let r = 1; r <= leadCount; r++) {
      const isSent = statusVal === 'done' ? true : statusVal === 'in_progress' ? r <= Math.floor(leadCount * 0.65) : false;
      const isOpened = isSent && (r % 2 === 0);
      const isReplied = isOpened && (r % 5 === 0);

      recipients.push({
        id: `rec-${i}-${r}`,
        email: `prospect.${r}@${ind.toLowerCase().replace(/[^a-z]/g, '')}-${i}.com`,
        firstName: `Leader${r}`,
        company: `${ind.split(' ')[0]} #${i}`,
        title: 'VP of Growth & Engineering',
        website: `https://${ind.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        icebreaker: `Impressive scale and architecture with ${ind.split(' ')[0]}.`,
        pitchUrl: `${origin}/p/${ind.toLowerCase().replace(/[^a-z]/g, '')}-${i}`,
        status: isReplied ? 'replied' as const : isOpened ? 'opened' as const : isSent ? 'sent' as const : 'pending' as const,
        sentAt: isSent ? `10:${String(10 + (r % 45)).padStart(2, '0')} AM` : undefined
      });
    }

    campaigns.push({
      id: `camp-hv-${i}`,
      name: `#${String(i).padStart(3, '0')}: ${ind} Enterprise Outreach (${loc.split(' ')[0]})`,
      fromName: i % 2 === 0 ? 'Alex Turner' : 'Sarah Jenkins',
      senderId: senders[i % senders.length],
      selectedSenderIds: senders.slice(0, (i % 3) + 2),
      delaySeconds: 40 + (i % 35),
      dailyLimit: 100 + ((i * 15) % 150),
      windowStart: '09:00',
      windowEnd: '17:30',
      timezone: tz,
      is24Hours: is24h,
      status: statusVal,
      trackOpens: true,
      trackClicks: true,
      includeUnsubscribe: true,
      unsubscribeText: 'PS: Let me know if you would like me to remove your address.',
      steps: [
        {
          id: 1,
          dayDelay: 0,
          subject: `{Quick question|Brief inquiry} re: ${ind.split(' ')[0]} scaling in ${loc.split(' ')[0]}`,
          body: `Hey {{First_Name}},\n\n{{Icebreaker}}\n\nWe put together a tailored deliverability review for {{Company}} here: {{Pitch_Page_URL}}\n\nWorth a brief 5-minute sync this week?\n\nBest,\nAlex`
        },
        {
          id: 2,
          dayDelay: 3,
          subject: `Re: quick question re: {{Company}}`,
          body: `Hi {{First_Name}},\n\nWanted to float this back to the top of your inbox. Did you get a chance to take a look at the custom walkthrough ({{Pitch_Page_URL}})?\n\nBest,\nAlex`
        }
      ],
      recipients,
      createdAt: new Date(Date.now() - (count - i) * 7200000).toISOString()
    });
  }

  return campaigns;
}
