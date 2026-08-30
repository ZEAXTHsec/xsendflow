/**
 * Supabase Outbound Email Logs & Daily Quota Sync
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putztvsdxuprkbxufrge.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzIzNDgyMiwiZXhwIjoyMDk4ODEwODIyfQ.vDCdwY8j2z_m-AGHe6AMwHD8eiMLqqr0Mq6D0EBZeAs';

export interface EmailLogEntry {
  id?: string;
  user_id?: string;
  sender_email: string;
  recipient_email: string;
  campaign_id: string;
  status: 'delivered' | 'bounced' | 'failed';
  sent_at?: string;
}

/**
 * Inserts a delivered or failed email event into Supabase
 */
export async function logDispatchedEmail(entry: EmailLogEntry): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/outbound_email_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id: entry.user_id || entry.sender_email,
        sender_email: entry.sender_email.toLowerCase().trim(),
        recipient_email: entry.recipient_email.toLowerCase().trim(),
        campaign_id: entry.campaign_id || 'general',
        status: entry.status,
        sent_at: entry.sent_at || new Date().toISOString()
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to log email to Supabase:', err);
    return false;
  }
}

/**
 * Queries exact count of delivered emails sent by a user account today (since 00:00 UTC) across all mailboxes
 */
export async function getUserDailySentCount(userId: string): Promise<number> {
  try {
    const todayIso = new Date();
    todayIso.setUTCHours(0, 0, 0, 0);
    const startOfToday = todayIso.toISOString();

    const cleanUser = encodeURIComponent(userId.toLowerCase().trim());
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/outbound_email_logs?user_id=eq.${cleanUser}&sent_at=gte.${encodeURIComponent(startOfToday)}&status=eq.delivered&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Range-Unit': 'items',
          'Prefer': 'count=exact'
        }
      }
    );

    if (!res.ok) return 0;
    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts[1]) {
        return parseInt(parts[1], 10) || 0;
      }
    }
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error('Failed to fetch user daily count from Supabase:', err);
    return 0;
  }
}

/**
 * Queries exact count of delivered emails sent by a sender today (since 00:00 UTC)
 */
export async function getSenderDailySentCount(senderEmail: string): Promise<number> {
  try {
    const todayIso = new Date();
    todayIso.setUTCHours(0, 0, 0, 0);
    const startOfToday = todayIso.toISOString();

    const cleanEmail = encodeURIComponent(senderEmail.toLowerCase().trim());
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/outbound_email_logs?sender_email=eq.${cleanEmail}&sent_at=gte.${encodeURIComponent(startOfToday)}&status=eq.delivered&select=id`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Range-Unit': 'items',
          'Prefer': 'count=exact'
        }
      }
    );

    if (!res.ok) return 0;
    const contentRange = res.headers.get('content-range');
    if (contentRange) {
      const parts = contentRange.split('/');
      if (parts[1]) {
        return parseInt(parts[1], 10) || 0;
      }
    }
    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error('Failed to fetch sender daily count from Supabase:', err);
    return 0;
  }
}

/**
 * Returns a map of all senders and their daily sent count today
 */
export async function getAllSendersDailyCounts(): Promise<Record<string, number>> {
  try {
    const todayIso = new Date();
    todayIso.setUTCHours(0, 0, 0, 0);
    const startOfToday = todayIso.toISOString();

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/outbound_email_logs?sent_at=gte.${encodeURIComponent(startOfToday)}&select=sender_email`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (!res.ok) return {};
    const data = await res.json();
    const counts: Record<string, number> = {};

    if (Array.isArray(data)) {
      data.forEach((row: { sender_email: string }) => {
        const email = row.sender_email?.toLowerCase();
        if (email) {
          counts[email] = (counts[email] || 0) + 1;
        }
      });
    }

    return counts;
  } catch (err) {
    console.error('Failed to fetch all senders daily counts:', err);
    return {};
  }
}
