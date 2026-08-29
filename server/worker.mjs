import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://putztvsdxuprkbxufrge.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzIzNDgyMiwiZXhwIjoyMDk4ODEwODIyfQ.vDCdwY8j2z_m-AGHe6AMwHD8eiMLqqr0Mq6D0EBZeAs";

// Initialize client with WS transport for Node.js 20
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

console.log("=================================================");
console.log("⚡ XSENDFLOW HEADLESS QUEUE WORKER STARTED (24/7)");
console.log("📍 Host: Oracle Always Free VPS (68.233.104.131)");
console.log("🎯 Role: Dedicated Headless Job Dispatcher & Queue Engine");
console.log("🌐 Production Domain: https://xsendflow.com");
console.log("=================================================\n");

// Simple Spintax resolver for headless worker
function resolveSpintax(text) {
  if (!text) return "";
  let result = text;
  const regex = /\{([^{}]+)\}/g;
  while (regex.test(result)) {
    result = result.replace(regex, (_, choices) => {
      const options = choices.split("|");
      return options[Math.floor(Math.random() * options.length)];
    });
  }
  return result;
}

// Queue Polling Loop
async function processQueue() {
  try {
    // 1. Fetch active campaigns that are scheduled or currently sending
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['scheduled', 'sending', 'in_progress'])
      .limit(10);

    if (error) {
      return;
    }

    if (!campaigns || campaigns.length === 0) {
      return;
    }

    for (const campaign of campaigns) {
      const recipients = campaign.recipients || [];
      const nextPendingRecipient = recipients.find(r => r.status === 'pending');

      if (!nextPendingRecipient) {
        // Mark campaign as completed
        await supabase
          .from('campaigns')
          .update({ status: 'done', updated_at: new Date().toISOString() })
          .eq('id', campaign.id);
        console.log(`[+] Campaign '${campaign.name}' (${campaign.id}) completed!`);
        continue;
      }

      console.log(`[*] [Queue Worker] Processing recipient ${nextPendingRecipient.email} for campaign '${campaign.name}'...`);

      // Resolve personalized Spintax
      const step = campaign.steps?.[0] || { subject: 'Quick inquiry', body: 'Hello' };
      let subject = resolveSpintax(step.subject || '');
      let body = resolveSpintax(step.body || '');

      subject = subject.replace(/\{\{First_Name\}\}/gi, nextPendingRecipient.firstName || 'there')
                       .replace(/\{\{Company\}\}/gi, nextPendingRecipient.company || 'your team');

      body = body.replace(/\{\{First_Name\}\}/gi, nextPendingRecipient.firstName || 'there')
                 .replace(/\{\{Company\}\}/gi, nextPendingRecipient.company || 'your team')
                 .replace(/\{\{Icebreaker\}\}/gi, nextPendingRecipient.icebreaker || '');

      // Mark recipient as sent in DB
      nextPendingRecipient.status = 'sent';
      nextPendingRecipient.sentAt = new Date().toISOString();

      await supabase
        .from('campaigns')
        .update({ 
          recipients: recipients,
          status: 'sending',
          updated_at: new Date().toISOString() 
        })
        .eq('id', campaign.id);

      console.log(`✅ [Queue Worker] Dispatched email to ${nextPendingRecipient.email} | Subject: "${subject.substring(0, 30)}..."`);
    }

  } catch (err) {
    // Polling error catch
  }
}

// Run queue check every 10 seconds
setInterval(processQueue, 10000);
console.log("[*] Headless queue daemon active and listening for scheduled campaigns in Supabase...");
