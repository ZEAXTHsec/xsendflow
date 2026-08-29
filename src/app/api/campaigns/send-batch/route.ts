import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { parseDeepSpintax } from '@/lib/engine/spintaxFSM';
import { selectHealthySender } from '@/lib/engine/humanJitter';
import { SenderAccount } from '@/components/tabs/SendersTab';

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
      unsubscribeText
    } = await req.json();

    if (!Array.isArray(senders) || !senders.length) {
      return NextResponse.json({ success: false, error: 'No sender accounts available' }, { status: 400 });
    }
    if (!Array.isArray(recipients) || !recipients.length) {
      return NextResponse.json({ success: false, error: 'No recipients provided' }, { status: 400 });
    }

    const results = [];
    const failedSenderIds = new Set<string>();

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      // Auto-failover: Pick the best healthy sender, avoiding previously failed ones
      const sender: SenderAccount = selectHealthySender(senders as SenderAccount[], failedSenderIds) || (senders[i % senders.length] as SenderAccount) || (senders[0] as SenderAccount);

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

        // Append custom opt-out / unsubscribe text if configured
        if (unsubscribeText) {
          const resolvedUnsub = replaceTag(unsubscribeText, 'Unsubscribe_Link', unsubUrl);
          renderedBody += `\n\n${resolvedUnsub}`;
        }

        // Optional Tracking Pixel
        const trackingPixel = trackOpens 
          ? `<img src="${appUrl}/api/track/open/${encodeURIComponent(recipient.id || recipient.email)}" width="1" height="1" style="display:none;" alt="" />`
          : '';

        // Cross-client clean HTML email wrapper
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

        results.push({
          recipientId: recipient.id,
          email: recipient.email,
          success: true,
          messageId: info.messageId,
          sentBy: sender.email
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Send failed';
        const isLeadBounce = errorMsg.includes('550') || 
                             errorMsg.includes('553') || 
                             errorMsg.includes('recipient') || 
                             errorMsg.includes('User unknown') || 
                             errorMsg.includes('mailbox unavailable');

        // Only mark sender as failed if it's an SMTP auth/connection/rate-limit issue, NOT a bad lead address!
        if (!isLeadBounce) {
          failedSenderIds.add(sender.id);
        }

        results.push({
          recipientId: recipient.id,
          email: recipient.email,
          success: false,
          isBounce: isLeadBounce,
          error: errorMsg,
          sentBy: sender.email
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
