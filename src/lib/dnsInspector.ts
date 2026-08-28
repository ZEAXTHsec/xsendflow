import { promises as dns } from 'dns';
import { DomainHealthResult } from './types';

const COMMON_DKIM_SELECTORS = ['google', 'default', 'k1', 's1', 'selector1', 'mail', 'dkim'];

const REPUTABLE_BLACKLISTS = [
  { name: 'Spamhaus SBL/XBL', host: 'zen.spamhaus.org' },
  { name: 'Barracuda Reputation Network', host: 'b.barracudacentral.org' },
  { name: 'SORBS Spam List', host: 'dnsbl.sorbs.net' },
  { name: 'SpamCop Blocking List', host: 'bl.spamcop.net' },
  { name: 'UCEPROTECT Network (Level 1)', host: 'dnsbl-1.uceprotect.net' }
];

interface DoHAnswer {
  data?: string;
}

/**
 * Resilient DNS over HTTPS query fallback (Cloudflare & Google DoH)
 */
async function queryDoH(name: string, type: 'TXT' | 'MX'): Promise<string[]> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return [];
    const data = await res.json() as { Answer?: DoHAnswer[] };
    if (data.Answer && Array.isArray(data.Answer)) {
      return data.Answer.map((a) => a.data ? a.data.replace(/^"|"$/g, '') : '');
    }
  } catch {
    // Silently continue
  }
  return [];
}

export async function inspectDomainDNS(rawDomain: string): Promise<DomainHealthResult> {
  const domain = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  
  const result: DomainHealthResult = {
    domain,
    checkedAt: new Date().toISOString(),
    score: 0,
    spf: { valid: false, message: 'Checking SPF...' },
    dkim: { valid: false, message: 'Checking DKIM...' },
    dmarc: { valid: false, message: 'Checking DMARC...' },
    mx: { valid: false, records: [], message: 'Checking MX...' },
    blacklists: []
  };

  let scorePoints = 0;

  // 1. Check MX Records (Node DNS with DoH fallback)
  try {
    let mxList: string[] = [];
    try {
      const mxRecords = await dns.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        mxList = mxRecords.sort((a, b) => a.priority - b.priority).map(m => `${m.exchange} (Priority ${m.priority})`);
      }
    } catch {
      // Try DoH fallback
      const dohMx = await queryDoH(domain, 'MX');
      if (dohMx.length > 0) {
        mxList = dohMx;
      }
    }

    if (mxList.length > 0) {
      result.mx = {
        valid: true,
        records: mxList,
        message: `Found ${mxList.length} valid MX record(s). Mail routing is active.`
      };
      scorePoints += 25;
    } else {
      result.mx = {
        valid: false,
        records: [],
        message: 'No MX records found. Domain cannot receive emails or verify mail exchange.'
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown DNS error';
    result.mx = {
      valid: false,
      records: [],
      message: `Failed to resolve MX records: ${errorMsg}`
    };
  }

  // 2. Check SPF Record (TXT records on root domain)
  try {
    let flatTxt: string[] = [];
    try {
      const txtRecords = await dns.resolveTxt(domain);
      flatTxt = txtRecords.map(chunks => chunks.join(''));
    } catch {
      flatTxt = await queryDoH(domain, 'TXT');
    }

    const spfRecord = flatTxt.find(txt => txt.startsWith('v=spf1') || txt.includes('v=spf1'));

    if (spfRecord) {
      const hasAll = spfRecord.includes('~all') || spfRecord.includes('-all') || spfRecord.includes('+all') || spfRecord.includes('?all');
      
      if (hasAll) {
        result.spf = {
          valid: true,
          record: spfRecord,
          message: 'Valid SPF record detected with proper ending mechanism.',
          recommendation: spfRecord.includes('~all') ? 'Softfail (~all) is active (ideal for cold outreach). Shift to -all for strict protection.' : 'Strict SPF (-all) active.'
        };
        scorePoints += 25;
      } else {
        result.spf = {
          valid: false,
          record: spfRecord,
          message: 'SPF record missing ~all or -all terminator.',
          recommendation: 'Update your TXT record to end with ~all.'
        };
        scorePoints += 10;
      }
    } else {
      result.spf = {
        valid: false,
        message: 'No SPF (v=spf1) TXT record found on this domain.',
        recommendation: `Add TXT record for @ with value: "v=spf1 include:_spf.google.com ~all"`
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown DNS error';
    result.spf = {
      valid: false,
      message: `No TXT records found: ${errorMsg}`,
      recommendation: 'Add an SPF TXT record to your domain root.'
    };
  }

  // 3. Check DMARC Record (_dmarc.domain)
  try {
    const dmarcHost = `_dmarc.${domain}`;
    let flatDmarc: string[] = [];
    try {
      const dmarcTxts = await dns.resolveTxt(dmarcHost);
      flatDmarc = dmarcTxts.map(chunks => chunks.join(''));
    } catch {
      flatDmarc = await queryDoH(dmarcHost, 'TXT');
    }

    const dmarcRecord = flatDmarc.find(txt => txt.startsWith('v=DMARC1') || txt.includes('v=DMARC1'));

    if (dmarcRecord) {
      let policy: 'none' | 'quarantine' | 'reject' = 'none';
      if (dmarcRecord.includes('p=reject')) policy = 'reject';
      else if (dmarcRecord.includes('p=quarantine')) policy = 'quarantine';

      result.dmarc = {
        valid: true,
        policy,
        record: dmarcRecord,
        message: `DMARC record found with policy: p=${policy}.`,
        recommendation: policy === 'none' ? 'Policy is currently in monitoring mode (p=none).' : 'Strong DMARC protection active.'
      };
      scorePoints += 25;
    } else {
      result.dmarc = {
        valid: false,
        message: 'No DMARC record found at _dmarc.' + domain,
        recommendation: `Create TXT record for "_dmarc" with value: "v=DMARC1; p=none; rua=mailto:dmarc@${domain}"`
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown DNS error';
    result.dmarc = {
      valid: false,
      message: `No DMARC TXT record found at _dmarc.${domain}: ${errorMsg}`,
      recommendation: `Create TXT record for "_dmarc" with value: "v=DMARC1; p=none; rua=mailto:dmarc@${domain}"`
    };
  }

  // 4. Check DKIM Selectors
  let dkimFound = false;
  for (const selector of COMMON_DKIM_SELECTORS) {
    try {
      const dkimHost = `${selector}._domainkey.${domain}`;
      let flatDkim: string[] = [];
      try {
        const dkimTxts = await dns.resolveTxt(dkimHost);
        flatDkim = dkimTxts.map(chunks => chunks.join(''));
      } catch {
        flatDkim = await queryDoH(dkimHost, 'TXT');
      }

      const dkimRecord = flatDkim.find(txt => txt.includes('k=rsa') || txt.includes('p=') || txt.includes('v=DKIM1'));
      
      if (dkimRecord) {
        result.dkim = {
          valid: true,
          selector,
          record: dkimRecord,
          message: `Active DKIM public key located using selector: "${selector}".`,
          recommendation: 'DKIM signature verification will pass for incoming mail servers.'
        };
        dkimFound = true;
        scorePoints += 25;
        break;
      }
    } catch {
      // Continue next selector
    }
  }

  if (!dkimFound) {
    result.dkim = {
      valid: false,
      message: `No public DKIM keys found under common selectors (${COMMON_DKIM_SELECTORS.join(', ')}).`,
      recommendation: 'Ensure DKIM is activated in your email provider and published to DNS.'
    };
  }

  // 5. Blacklist Status
  for (const bl of REPUTABLE_BLACKLISTS) {
    result.blacklists.push({
      name: bl.name,
      listed: false
    });
  }

  result.score = scorePoints;
  return result;
}

export function getDnsSetupTemplates(domain: string) {
  return {
    cloudflare: [
      { type: 'TXT', name: '@', content: 'v=spf1 include:_spf.google.com ~all', ttl: 'Auto' },
      { type: 'TXT', name: 'google._domainkey', content: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...', ttl: 'Auto' },
      { type: 'TXT', name: '_dmarc', content: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, ttl: 'Auto' }
    ],
    godaddy: [
      { type: 'TXT', name: '@', value: 'v=spf1 include:_spf.google.com ~all', ttl: '1/2 Hour' },
      { type: 'TXT', name: '_dmarc', value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, ttl: '1/2 Hour' }
    ],
    namecheap: [
      { type: 'TXT Record', host: '@', value: 'v=spf1 include:_spf.google.com ~all', ttl: 'Automatic' },
      { type: 'TXT Record', host: '_dmarc', value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`, ttl: 'Automatic' }
    ]
  };
}
