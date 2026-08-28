import nodemailer from 'nodemailer';
import tls from 'tls';

// 1. All 4 Outbound Accounts
const SENDER_ACCOUNTS = [
  {
    id: 'sender-google-1',
    email: 'aftab@digixflyy.online',
    label: 'Aftab M. (Google Workspace)',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'aftab@digixflyy.online',
    smtpPass: 'pjenrrxrswdxhqdj'
  },
  {
    id: 'sender-hostinger-1',
    email: 'aftab@poe2lab.com',
    label: 'Hostinger Inbox 1',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpUser: 'aftab@poe2lab.com',
    smtpPass: 'Aftab123)'
  },
  {
    id: 'sender-hostinger-2',
    email: 'aftab@aftabconsults.com',
    label: 'Hostinger Inbox 2',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpUser: 'aftab@aftabconsults.com',
    smtpPass: 'Aftab123)'
  },
  {
    id: 'sender-hostinger-3',
    email: 'aftab@mohammadaftab.com',
    label: 'Hostinger Inbox 3',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpUser: 'aftab@mohammadaftab.com',
    smtpPass: 'Aftab123)'
  }
];

// 2. 8 Target Catchall Contacts
const RECIPIENTS = [
  { id: '1', email: 'aftab@digixflyy.online', firstName: 'Aftab', company: 'DigiXFlyy', title: 'Founder' },
  { id: '2', email: 'aftab@poe2lab.com', firstName: 'Aftab', company: 'Poe2Lab', title: 'CEO' },
  { id: '3', email: 'aftab@aftabconsults.com', firstName: 'Aftab', company: 'AftabConsults', title: 'Managing Principal' },
  { id: '4', email: 'aftab@mohammadaftab.com', firstName: 'Mohammad', company: 'MohammadAftab', title: 'Chief Strategist' },
  { id: '5', email: 'test1@digixflyy.online', firstName: 'Aftab', company: 'DigiXFlyy Labs', title: 'VP of Outbound' },
  { id: '6', email: 'hello@poe2lab.com', firstName: 'Aftab', company: 'Poe2Lab AI', title: 'Head of Partnerships' },
  { id: '7', email: 'growth@aftabconsults.com', firstName: 'Aftab', company: 'AftabConsults Advisory', title: 'Director of BD' },
  { id: '8', email: 'inbox@mohammadaftab.com', firstName: 'Aftab', company: 'MohammadAftab Media', title: 'Founder' }
];

function resolveSpintax(text) {
  return text.replace(/\{([^{}]+)\}/g, (_, choices) => {
    const arr = choices.split('|');
    return arr[Math.floor(Math.random() * arr.length)];
  });
}

function resolveTags(text, recip) {
  return text
    .replace(/\{\{First_Name\}\}/gi, recip.firstName || 'there')
    .replace(/\{\{Company\}\}/gi, recip.company || 'your company')
    .replace(/\{\{Title\}\}/gi, recip.title || 'Growth Leader')
    .replace(/\{\{Pitch_Page_URL\}\}/gi, `http://localhost:3000/p/${encodeURIComponent((recip.company || 'team').toLowerCase())}`);
}

async function sendLiveCampaignBatch() {
  console.log('====================================================');
  console.log('🚀 STEP 1: EXECUTING LIVE CAMPAIGN DISPATCH (8 EMAILS)');
  console.log('====================================================');

  const subjectTemplate = '{Quick question|Brief inquiry} re: {{Company}}';
  const bodyTemplate = `Hey {{First_Name}},\n\nSaw what you're building at {{Company}}.\n\nPut together a custom deliverability roadmap for {{Company}} here: {{Pitch_Page_URL}}\n\nWorth a quick 5-minute sync?\n\nBest,\nAftab M.`;

  const results = [];

  for (let i = 0; i < RECIPIENTS.length; i++) {
    const recip = RECIPIENTS[i];
    // Rotate senders across accounts
    const sender = SENDER_ACCOUNTS[i % SENDER_ACCOUNTS.length];

    const subject = resolveTags(resolveSpintax(subjectTemplate), recip);
    const body = resolveTags(resolveSpintax(bodyTemplate), recip);

    console.log(`\n📨 Dispatching #${i + 1}/8:`);
    console.log(`   From:    ${sender.email} (${sender.label})`);
    console.log(`   To:      ${recip.email}`);
    console.log(`   Subject: ${subject}`);

    try {
      const isSSL = Number(sender.smtpPort) === 465;
      const transporter = nodemailer.createTransport({
        host: sender.smtpHost,
        port: Number(sender.smtpPort),
        secure: isSSL,
        auth: {
          user: sender.smtpUser,
          pass: sender.smtpPass
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000
      });

      const info = await transporter.sendMail({
        from: `"${sender.label}" <${sender.email}>`,
        to: recip.email,
        subject,
        text: body,
        html: `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;">
          ${body.replace(/\n/g, '<br/>')}
        </div>`
      });

      console.log(`   ✅ DELIVERED! Message ID: ${info.messageId}`);
      results.push({ success: true, to: recip.email, messageId: info.messageId });
    } catch (err) {
      console.log(`   ❌ Error sending to ${recip.email}:`, err.message);
      results.push({ success: false, to: recip.email, error: err.message });
    }

    // Delay 1 second between sends
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n====================================================');
  console.log(`📊 DISPATCH SUMMARY: ${results.filter(r => r.success).length}/${results.length} EMAILS ACCEPTED BY SMTP SERVERS`);
  console.log('====================================================');
}

// Simple raw IMAP checker over TLS socket
function checkHostingerImap(email, password) {
  return new Promise((resolve) => {
    console.log(`\n📬 Checking IMAP Inbox for ${email} at imap.hostinger.com:993...`);

    const client = tls.connect(993, 'imap.hostinger.com', { rejectUnauthorized: false }, () => {
      // connected
    });

    let step = 0;
    let output = '';

    client.on('data', (data) => {
      const str = data.toString();
      output += str;

      if (step === 0 && str.includes('* OK')) {
        step = 1;
        client.write(`A1 LOGIN "${email}" "${password}"\r\n`);
      } else if (step === 1 && str.includes('A1 OK')) {
        console.log(`   🔑 IMAP Auth Successful for ${email}!`);
        step = 2;
        client.write(`A2 SELECT INBOX\r\n`);
      } else if (step === 2 && str.includes('A2 OK')) {
        console.log(`   📁 INBOX Selected successfully.`);
        step = 3;
        // Search last 5 messages
        client.write(`A3 FETCH 1:* (BODY[HEADER.FIELDS (SUBJECT FROM DATE)])\r\n`);
      } else if (step === 3 && (str.includes('A3 OK') || str.includes('A3 NO') || str.includes('A3 BAD'))) {
        step = 4;
        client.write(`A4 LOGOUT\r\n`);
        client.end();
      }
    });

    client.on('end', () => {
      const subjects = output.match(/Subject: [^\r\n]+/gi) || [];
      const froms = output.match(/From: [^\r\n]+/gi) || [];
      console.log(`   📬 Recent Emails Found in ${email} Inbox: ${subjects.length}`);
      for (let i = Math.max(0, subjects.length - 3); i < subjects.length; i++) {
        console.log(`      • ${froms[i] || 'From: unknown'} | ${subjects[i]}`);
      }
      resolve({ email, count: subjects.length, recent: subjects.slice(-3) });
    });

    client.on('error', (err) => {
      console.log(`   ⚠️ IMAP Check error for ${email}:`, err.message);
      resolve({ email, error: err.message });
    });

    setTimeout(() => {
      try { client.end(); } catch {}
      resolve({ email, timeout: true });
    }, 10000);
  });
}

async function runFullVerification() {
  await sendLiveCampaignBatch();

  console.log('\n⏳ Waiting 8 seconds for MX delivery to arrive in inboxes...');
  await new Promise(r => setTimeout(r, 8000));

  console.log('\n====================================================');
  console.log('📥 STEP 2: VERIFYING INBOXES VIA IMAP');
  console.log('====================================================');

  await checkHostingerImap('aftab@poe2lab.com', 'Aftab123)');
  await checkHostingerImap('aftab@aftabconsults.com', 'Aftab123)');
  await checkHostingerImap('aftab@mohammadaftab.com', 'Aftab123)');

  console.log('\n====================================================');
  console.log('🎉 ALL LIVE SENDS & INBOX VERIFICATIONS COMPLETE!');
  console.log('====================================================');
}

runFullVerification();
