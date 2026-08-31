export interface Lead {
  id: string;
  rawFirstName: string;
  rawLastName?: string;
  rawCompany: string;
  rawTitle?: string;
  email: string;
  cleanFirstName: string;
  cleanCompany: string;
  cleanTitle: string;
  icebreaker: string;
  isRoleEmail: boolean;
  isValidEmail: boolean;
  pitchSlug?: string;
  pitchUrl?: string;
  status: 'pending' | 'cleaned' | 'error';
  createdAt?: string;
  updatedAt?: string;
}

export interface SequenceStep {
  id: number;
  day: number;
  type: 'initial' | 'followup' | 'nudge' | 'breakup';
  title: string;
  subject: string;
  body: string;
  spamScore: number;
  spamWordsFound: string[];
}

export interface PitchPageConfig {
  slug: string;
  prospectName: string;
  companyName: string;
  companyDomain: string;
  headline: string;
  subheadline: string;
  bullets: [string, string, string];
  videoUrl?: string;
  ctaText: string;
  calendarUrl: string;
  themeColor: string;
}

export interface DomainHealthResult {
  domain: string;
  checkedAt: string;
  score: number; // 0 - 100
  spf: {
    valid: boolean;
    record?: string;
    message: string;
    recommendation?: string;
  };
  dkim: {
    valid: boolean;
    selector?: string;
    record?: string;
    message: string;
    recommendation?: string;
  };
  dmarc: {
    valid: boolean;
    policy?: 'none' | 'quarantine' | 'reject';
    record?: string;
    message: string;
    recommendation?: string;
  };
  mx: {
    valid: boolean;
    records: string[];
    message: string;
  };
  blacklists: {
    name: string;
    listed: boolean;
  }[];
}
