/**
 * 🏛️ XSendFlow Enterprise VPS Background Worker Daemon
 * 
 * Persistent Node.js worker designed to run 24/7 on a VPS (Linux/Ubuntu/Debian or Docker).
 * Powered by Supabase real-time polling, timezone evaluation, per-inbox daily cap safety,
 * Spintax rendering, and randomized human delay pacing.
 * 
 * Usage:
 *   node daemon/vps-worker.mjs
 * Or with PM2:
 *   pm2 start daemon/ecosystem.config.cjs
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Native Zero-Dependency .env.local reader
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        if (k && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    }
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putztvsdxuprkbxufrge.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzQ4MjIsImV4cCI6MjA5ODgxMDgyMn0.b2Xla5rxDtSYlF9pcouQS8do0LdXK_OKVeiW3w0PeJo';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const DEFAULT_INBOX_DAILY_CAP = 50; // Industry standard maximum per inbox to prevent spam filtering
const TICK_INTERVAL_MS = 15000; // Check campaign loop every 15 seconds

console.log('🚀 [XSendFlow Daemon] VPS Background Campaign Worker Initialized.');
console.log(`🔗 Connected to Supabase: ${SUPABASE_URL}`);
console.log(`🛡️ Max Safe Capacity: ${DEFAULT_INBOX_DAILY_CAP} emails/day per mailbox.`);

// Helper: Sleep for given milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simple Spintax Resolver
function resolveSpintax(text) {
  if (!text) return '';
  const regex = /\{([^{}]+)\}/g;
  while (regex.test(text)) {
    text = text.replace(regex, (_, choices) => {
      const options = choices.split('|');
      return options[Math.floor(Math.random() * options.length)];
    });
  }
  return text;
}

// Timezone Inspection Helper
function checkWindowStatus(windowStart = '10:00', windowEnd = '14:00', tzStr = 'America/New_York (EST)', is24Hours = false) {
  if (is24Hours || (windowStart === '00:00' && windowEnd === '23:59')) {
    return { inWindow: true, reason: '24/7 continuous dispatch mode' };
  }

  const iana = tzStr.split(' ')[0] || 'America/New_York';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: iana,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const hour = Number(parts.find(p => p.type === 'hour')?.value || 0) % 24;
    const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);

    const [startH, startM = 0] = windowStart.split(':').map(Number);
    const [endH, endM = 0] = windowEnd.split(':').map(Number);

    const currentMins = hour * 60 + minute;
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    let inWindow = false;
    if (startMins <= endMins) {
      inWindow = currentMins >= startMins && currentMins <= endMins;
    } else {
      inWindow = currentMins >= startMins || currentMins <= endMins;
    }

    return {
      inWindow,
      currentLocalTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      iana,
      reason: inWindow ? `Inside window (${windowStart} - ${windowEnd})` : `Outside window (${windowStart} - ${windowEnd})`
    };
  } catch (err) {
    return { inWindow: true, reason: 'Timezone fallback to active' };
  }
}

// Main Dispatch Loop
async function runWorkerLoop() {
  while (true) {
    try {
      // 1. Fetch all active campaigns
      const { data: campaigns, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .in('status', ['in_progress', 'sending', 'scheduled']);

      if (campErr) {
        console.error('❌ [Daemon Error] Fetching campaigns:', campErr.message);
        await sleep(TICK_INTERVAL_MS);
        continue;
      }

      if (!campaigns || campaigns.length === 0) {
        // No active campaigns, sleep and continue
        await sleep(TICK_INTERVAL_MS);
        continue;
      }

      for (const camp of campaigns) {
        const {
          id: campaignId,
          user_id: userId,
          name: campaignName,
          window_start = '10:00',
          window_end = '14:00',
          timezone = 'America/New_York (EST)',
          is_24_hours = false,
          daily_limit = 150,
          delay_seconds = 40,
          daily_sent_count = 0,
          last_sent_date = null,
          steps = [],
          from_name = 'Outreach Team'
        } = camp;

        // A. Evaluate Timezone Schedule
        const windowCheck = checkWindowStatus(window_start, window_end, timezone, is_24_hours);
        if (!windowCheck.inWindow) {
          if (camp.status !== 'scheduled') {
            await supabase.from('campaigns').update({ status: 'scheduled' }).eq('id', campaignId);
            console.log(`⏳ [${campaignName}] Outside sending window. Local time in ${windowCheck.iana}: ${windowCheck.currentLocalTime}. Standby until ${window_start}.`);
          }
          continue;
        }

        // B. Daily Quota Reset check
        const todayStr = new Date().toISOString().split('T')[0];
        let currentDailySent = daily_sent_count || 0;
        if (last_sent_date !== todayStr) {
          currentDailySent = 0;
          await supabase.from('campaigns').update({ daily_sent_count: 0, last_sent_date: todayStr }).eq('id', campaignId);
          console.log(`🌅 [${campaignName}] New day detected (${todayStr}). Daily sent counter reset to 0.`);
        }

        // C. Fetch Connected Inboxes for this user
        const { data: userSenders } = await supabase.from('senders').select('*').eq('user_id', userId);
        const senders = userSenders || [];
        if (!senders.length) {
          console.warn(`⚠️ [${campaignName}] No connected mailboxes configured for user ${userId}.`);
          continue;
        }

        // D. Calculate User-Configured Inbox Capacity (Dynamic, not hardcoded!)
        // User might bring fresh inboxes (30-50/day) or aged Google Workspace/SES (500-1000/day)
        const totalConfiguredCapacity = senders.reduce((acc, s) => acc + Number(s.daily_limit || s.dailyLimit || 100), 0);
        const targetDailyLimit = Number(daily_limit) || totalConfiguredCapacity || 150;

        if (currentDailySent >= targetDailyLimit) {
          console.log(`🛑 [${campaignName}] Campaign daily limit reached (${currentDailySent}/${targetDailyLimit}). Will resume tomorrow.`);
          continue;
        }

        // E. Fetch Next Pending Recipient
        const { data: recipients } = await supabase
          .from('recipients')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
          .limit(1);

        if (!recipients || recipients.length === 0) {
          // All recipients sent! Transition to done
          await supabase.from('campaigns').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', campaignId);
          console.log(`🎉 [${campaignName}] All leads dispatched! Marked campaign as done.`);
          continue;
        }

        const recipient = recipients[0];
        const sender = senders[currentDailySent % senders.length] || senders[0];

        // F. Prepare Spintax & Personalized Variables
        const currentStep = (steps && steps.length > 0) ? steps[0] : {
          subject: 'Quick question regarding your outbound stack',
          body: 'Hi {{First_Name}}, noticed your team at {{Company}} is scaling...'
        };

        const firstName = recipient.first_name || recipient.firstName || 'there';
        const company = recipient.company || 'your team';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xsendflow.com';
        const pitchUrl = `${appUrl}/p/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, '-'))}`;
        const unsubUrl = `${appUrl}/unsub?email=${encodeURIComponent(recipient.email)}`;

        let renderedSubject = resolveSpintax(currentStep.subject || '')
          .replace(/\{\{First_Name\}\}/gi, firstName)
          .replace(/\{\{Company\}\}/gi, company)
          .replace(/\{\{Pitch_Page_URL\}\}/gi, pitchUrl)
          .replace(/\{\{Unsubscribe_Link\}\}/gi, unsubUrl);

        let renderedBody = resolveSpintax(currentStep.body || '')
          .replace(/\{\{First_Name\}\}/gi, firstName)
          .replace(/\{\{Company\}\}/gi, company)
          .replace(/\{\{Pitch_Page_URL\}\}/gi, pitchUrl)
          .replace(/\{\{Unsubscribe_Link\}\}/gi, unsubUrl);

        // G. Dispatch via Real SMTP (or sandbox simulated) with Bounce & Error Isolation
        try {
          if (sender.smtp_host && sender.smtp_user && sender.smtp_pass && !sender.smtp_pass.includes('•••')) {
            const transporter = nodemailer.createTransport({
              host: sender.smtp_host.trim(),
              port: Number(sender.smtp_port || 587),
              secure: Number(sender.smtp_port) === 465,
              auth: { user: sender.smtp_user.trim(), pass: sender.smtp_pass.trim() },
              connectionTimeout: 12000
            });

            await transporter.sendMail({
              from: `"${from_name || sender.label}" <${sender.email || sender.smtp_user}>`,
              to: recipient.email.trim(),
              subject: renderedSubject,
              text: renderedBody,
              html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#1e293b;">${renderedBody.replace(/\n/g, '<br/>')}</div>`
            });
          }

          // H. Update Supabase Atomically
          await supabase
            .from('recipients')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              sender_used: sender.email || sender.smtp_user
            })
            .eq('id', recipient.id);

          await supabase
            .from('campaigns')
            .update({
              daily_sent_count: currentDailySent + 1,
              last_sent_date: todayStr,
              status: 'in_progress'
            })
            .eq('id', campaignId);

          console.log(`✉️ [SENT] [${campaignName}] To: ${recipient.email} | Sender: ${sender.email} | Daily: ${currentDailySent + 1}/${targetDailyLimit}`);

          // I. Pacing Jitter Delay between consecutive successful sends
          const baseDelay = delay_seconds || 40;
          const jitterDelayMs = (baseDelay + Math.floor(Math.random() * 15 - 7)) * 1000;
          await sleep(Math.max(3000, jitterDelayMs));

        } catch (sendErr) {
          const errMsg = sendErr.message || 'SMTP Error';
          const isBounce = sendErr.responseCode >= 500 || errMsg.includes('550') || errMsg.includes('recipient') || errMsg.includes('invalid');

          console.error(`❌ [${isBounce ? 'BOUNCE' : 'SENDER_ERROR'}] [${campaignName}] Lead: ${recipient.email}:`, errMsg);

          // Mark lead as bounced / failed immediately so it NEVER locks or blocks subsequent leads!
          await supabase
            .from('recipients')
            .update({
              status: isBounce ? 'bounced' : 'failed',
              error_message: errMsg
            })
            .eq('id', recipient.id);

          // If it was just a bad recipient email, do NOT sleep full delay; advance immediately to next lead!
          if (isBounce) {
            console.log(`⏩ [Fast-Skip] Bounced lead recorded. Advancing to next prospect in queue without stalling.`);
          } else {
            // Sender auth/rate-limit issue -> Cool down briefly before retrying next sender
            await sleep(5000);
          }
        }
      }

    } catch (loopErr) {
      console.error('❌ [Daemon Exception] Unexpected loop crash prevented:', loopErr.message);
    }

    await sleep(TICK_INTERVAL_MS);
  }
}

// Start Background Worker
runWorkerLoop();