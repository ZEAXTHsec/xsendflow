import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { parseDeepSpintax } from '@/lib/engine/spintaxFSM';
import { selectHealthySender } from '@/lib/engine/humanJitter';
import { SenderAccount } from '@/components/tabs/SendersTab';
import { logDispatchedEmail, getSenderDailySentCount, getUserDailySentCount } from '@/lib/supabase/emailLogs';

export async function POST(req: NextRequest) {
  try {
    const { 
      senders, 
      recipients, 
      subject, 
      body, 
      fromName,
      trackOpens = true,
      trackClicks = true,
      unsubscribeText,
      campaignId = 'general',
      userId,
      userPlan = 'free'
    } = await req.json();

    if (!Array.isArray(senders) || !senders.length) {
      return NextResponse.json({ success: false, error: 'No sender accounts available' }, { status: 400 });
    }
    if (!Array.isArray(recipients) || !recipients.length) {
      return NextResponse.json({ success: false, error: 'No recipients provided' }, { status: 400 });
    }

    const results = [];
    const failedSenderIds = new Set<string>();
    const effectiveUserId = (userId || senders[0]?.email || 'default_user').toLowerCase().trim();

    // 1. Account-level Daily Limit for Free Tier (100 emails/day per user account across all mailboxes)
    if (userPlan === 'free') {
      const userDailySent = await getUserDailySentCount(effectiveUserId);
      if (userDailySent >= 100) {
        return NextResponse.json({
          success: false,
          code: 'DAILY_QUOTA_EXCEEDED',
          error: `Free tier daily limit of 100 emails reached for this account today. Campaign paused until daily reset at 00:00 UTC. Upgrade to Pro or Agency for higher capacity.`,
          currentCount: userDailySent,
          limit: 100
        }, { status: 429 });
      }
    }

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      let sentSuccessfully = false;
      let lastError = 'No available sender';
      let isLeadBounce = false;

      // Filter to currently healthy senders
      const availableSenders = senders.filter((s: SenderAccount) => !failedSenderIds.has(s.id));
      if (availableSenders.length === 0) {
        // All connected senders failed
        return NextResponse.json({
          success: false,
          code: 'ALL_SENDERS_FAILED',
          error: userPlan === 'free' 
            ? 'Your connected sender mailbox encountered an SMTP error. Please verify your SMTP credentials in Settings or try again.'
            : 'All connected sender mailboxes encountered provider rate limits or errors. Please add more sender inboxes or wait for provider cooldown.',
          results
        }, { status: 503 });
      }

      // Auto-failover: Try available senders sequentially for this recipient
      for (const sender of availableSenders) {
        try {
          const port = Number(sender.smtpPort || 587);
          const isSecure = port === 465;

          const transporter = nodemailer.createTransport({
            host: sender.smtpHost.trim(),
            port,
            secure: isSecure,
            auth: {
              user: sender.smtpUser.trim(),
              pass: sender.smtpPass.trim(),
            },
            connectionTimeout: 12000,
            tls: {
              rejectUnauthorized: false
            }
          });

          // 1. Resolve deep nested spintax
          let renderedSubject = parseDeepSpintax(subject || '');
          let renderedBody = parseDeepSpintax(body || '');

          // 2. Replace merge tags
          const replaceTag = (str: string, tag: string, val: string) => {
            return str.replace(new RegExp(`\\{\\{${tag}\\}\\}`, 'gi'), val);
          };

          const firstName = recipient.firstName || 'there';
          const company = recipient.company || 'your company';
          const website = recipient.website || '';
          const icebreaker = recipient.icebreaker || '';
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xsendflow.com';
          const pitchUrl = recipient.pitchUrl || `${appUrl}/p/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, '-'))}`;
          const unsubUrl = `${appUrl}/unsub?email=${encodeURIComponent(recipient.email)}`;

          renderedSubject = replaceTag(renderedSubject, 'First_Name', firstName);
          renderedSubject = replaceTag(renderedSubject, 'Company', company);
          renderedSubject = replaceTag(renderedSubject, 'Website', website);
          renderedSubject = replaceTag(renderedSubject, 'Icebreaker', icebreaker);
          renderedSubject = replaceTag(renderedSubject, 'Pitch_Page_URL', pitchUrl);
          renderedSubject = replaceTag(renderedSubject, 'Unsubscribe_Link', unsubUrl);

          renderedBody = replaceTag(renderedBody, 'First_Name', firstName);
          renderedBody = replaceTag(renderedBody, 'Company', company);
          renderedBody = replaceTag(renderedBody, 'Website', website);
          renderedBody = replaceTag(renderedBody, 'Icebreaker', icebreaker);
          renderedBody = replaceTag(renderedBody, 'Pitch_Page_URL', pitchUrl);
          renderedBody = replaceTag(renderedBody, 'Unsubscribe_Link', unsubUrl);

          if (unsubscribeText) {
            const resolvedUnsub = replaceTag(unsubscribeText, 'Unsubscribe_Link', unsubUrl);
            renderedBody += `\n\n${resolvedUnsub}`;
          }

          const trackingPixel = trackOpens 
            ? `<img src="${appUrl}/api/track/open/${encodeURIComponent(recipient.id || recipient.email)}" width="1" height="1" style="display:none;" alt="" />`
            : '';

          const htmlBody = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; margin: 0; padding: 0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
      <tr>
        <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">
          <div style="max-width: 580px; padding: 10px; margin: 0 auto;">
            ${renderedBody.replace(/\n/g, '<br/>')}
            ${trackingPixel}
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

          const senderEmail = sender.email || sender.smtpUser;
          const fromHeader = `"${fromName || sender.label || 'Outreach'}" <${senderEmail}>`;
          const unsubEmail = `unsub@${senderEmail.split('@')[1] || 'xsendflow.com'}`;

          const info = await transporter.sendMail({
            from: fromHeader,
            to: recipient.email.trim(),
            subject: renderedSubject,
            text: renderedBody,
            html: htmlBody,
            headers: {
              'List-Unsubscribe': `<mailto:${unsubEmail}?subject=unsubscribe>, <${unsubUrl}>`,
              'Precedence': 'bulk',
              'X-Mailer': 'XSendFlow Deliverability Engine 2.0'
            }
          });

          // Log delivered email to Supabase for daily quota tracking
          await logDispatchedEmail({
            user_id: effectiveUserId,
            sender_email: sender.email,
            recipient_email: recipient.email,
            campaign_id: campaignId,
            status: 'delivered'
          });

          results.push({
            recipientId: recipient.id,
            email: recipient.email,
            success: true,
            messageId: info.messageId,
            sentBy: sender.email
          });

          sentSuccessfully = true;
          break; // Successfully delivered through this sender, proceed to next lead
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : 'Send failed';
          isLeadBounce = lastError.includes('550') || 
                         lastError.includes('553') || 
                         lastError.includes('recipient') || 
                         lastError.includes('User unknown') || 
                         lastError.includes('mailbox unavailable');

          if (!isLeadBounce) {
            // SMTP provider error or auth failure -> mark sender as failed and try next available sender in pool!
            failedSenderIds.add(sender.id);
          } else {
            // Recipient doesn't exist -> no need to retry other senders
            break;
          }
        }
      }

      if (!sentSuccessfully) {
        // Log failed / bounced email to Supabase
        await logDispatchedEmail({
          user_id: effectiveUserId,
          sender_email: senders[0]?.email || 'unknown',
          recipient_email: recipient.email,
          campaign_id: campaignId,
          status: isLeadBounce ? 'bounced' : 'failed'
        });

        results.push({
          recipientId: recipient.id,
          email: recipient.email,
          success: false,
          isBounce: isLeadBounce,
          error: lastError,
          sentBy: senders[0]?.email || 'unknown'
        });
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Batch send error';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
