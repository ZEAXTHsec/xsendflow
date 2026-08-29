import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { inspectScheduleWindow, getTargetLocalTime } from '@/lib/engine/timeZoneScheduler';
import { selectHealthySender } from '@/lib/engine/humanJitter';
import { parseDeepSpintax } from '@/lib/engine/spintaxFSM';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  const startTime = Date.now();
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    const searchParams = req.nextUrl.searchParams;
    const secretQuery = searchParams.get('secret');
    if (secretQuery !== cronSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Unauthorized cron trigger' }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const auditLogs: any[] = [];
  let totalDispatched = 0;

  try {
    const { data: dbCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['in_progress', 'sending', 'scheduled']);

    const activeCampaigns = (dbCampaigns && dbCampaigns.length > 0) ? dbCampaigns : [];

    if (!activeCampaigns.length) {
      return NextResponse.json({
        success: true,
        message: 'No active campaigns in queue. Server cron dispatcher standing by.',
        activeCampaignsCount: 0,
        totalDispatched: 0,
        executionTimeMs: Date.now() - startTime
      });
    }

    for (const campaign of activeCampaigns) {
      const {
        id: campaignId,
        user_id: userId,
        name: campaignName,
        window_start = '10:00',
        window_end = '14:00',
        timezone = 'America/New_York (EST)',
        is_24_hours = false,
        daily_limit = 150,
        daily_sent_count = 0,
        last_sent_date = null,
        steps = [],
        from_name = 'Outreach Team'
      } = campaign;

      const windowStatus = inspectScheduleWindow(
        window_start,
        window_end,
        timezone,
        is_24_hours
      );

      const targetTime = getTargetLocalTime(timezone);
      const todayDateStr = new Date().toISOString().split('T')[0];

      let currentDailySent = daily_sent_count || 0;
      if (last_sent_date !== todayDateStr) {
        currentDailySent = 0;
        await supabase
          .from('campaigns')
          .update({ daily_sent_count: 0, last_sent_date: todayDateStr })
          .eq('id', campaignId);
      }

      if (!windowStatus.inWindow) {
        auditLogs.push({
          campaignId,
          campaignName,
          status: 'skipped_outside_window',
          localTargetTime: targetTime.timeString12,
          timezone,
          window: `${window_start} - ${window_end}`,
          reason: windowStatus.reason
        });
        continue;
      }

      if (currentDailySent >= daily_limit) {
        auditLogs.push({
          campaignId,
          campaignName,
          status: 'skipped_daily_limit_reached',
          dailySent: currentDailySent,
          dailyLimit: daily_limit,
          reason: `Daily limit of ${daily_limit} reached for today. Will resume tomorrow.`
        });
        continue;
      }

      const { data: userSenders } = await supabase
        .from('senders')
        .select('*')
        .eq('user_id', userId);

      const senders = (userSenders && userSenders.length > 0) ? userSenders : [];
      if (!senders.length) {
        auditLogs.push({
          campaignId,
          campaignName,
          status: 'skipped_no_senders',
          reason: 'No configured SMTP senders found.'
        });
        continue;
      }

      const remainingTodayQuota = daily_limit - currentDailySent;
      const batchSizeToDispatch = Math.min(remainingTodayQuota, 5);

      const { data: pendingRecipients } = await supabase
        .from('recipients')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .limit(batchSizeToDispatch);

      if (!pendingRecipients || !pendingRecipients.length) {
        await supabase
          .from('campaigns')
          .update({ status: 'done', completed_at: new Date().toISOString() })
          .eq('id', campaignId);

        auditLogs.push({
          campaignId,
          campaignName,
          status: 'campaign_completed',
          reason: 'All recipients finished.'
        });
        continue;
      }

      const currentStep = (steps && steps.length > 0) ? steps[0] : {
        subject: 'Quick inquiry regarding your sales pipeline',
        body: 'Hi {{First_Name}}, noticed {{Company}} is scaling sales...'
      };

      const failedSenders = new Set<string>();
      let batchDispatchedCount = 0;

      for (const recipient of pendingRecipients) {
        const sender = selectHealthySender(senders as any, failedSenders) || senders[0];

        try {
          let renderedSubject = parseDeepSpintax(currentStep.subject || '');
          let renderedBody = parseDeepSpintax(currentStep.body || '');

          const firstName = recipient.first_name || recipient.firstName || 'there';
          const company = recipient.company || 'your company';
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://xsendflow.com';
          const pitchUrl = `${appUrl}/p/${encodeURIComponent(company.toLowerCase().replace(/\s+/g, '-'))}`;
          const unsubUrl = `${appUrl}/unsub?email=${encodeURIComponent(recipient.email)}`;

          const replaceTag = (str: string, tag: string, val: string) =>
            str.replace(new RegExp(`\\{\\{${tag}\\}\\}`, 'gi'), val);

          renderedSubject = replaceTag(renderedSubject, 'First_Name', firstName);
          renderedSubject = replaceTag(renderedSubject, 'Company', company);
          renderedSubject = replaceTag(renderedSubject, 'Pitch_Page_URL', pitchUrl);
          renderedSubject = replaceTag(renderedSubject, 'Unsubscribe_Link', unsubUrl);

          renderedBody = replaceTag(renderedBody, 'First_Name', firstName);
          renderedBody = replaceTag(renderedBody, 'Company', company);
          renderedBody = replaceTag(renderedBody, 'Pitch_Page_URL', pitchUrl);
          renderedBody = replaceTag(renderedBody, 'Unsubscribe_Link', unsubUrl);

          if (sender.smtp_host && sender.smtp_user && sender.smtp_pass && !sender.smtp_pass.includes('•••')) {
            const transporter = nodemailer.createTransport({
              host: sender.smtp_host.trim(),
              port: Number(sender.smtp_port || 587),
              secure: Number(sender.smtp_port) === 465,
              auth: {
                user: sender.smtp_user.trim(),
                pass: sender.smtp_pass.trim()
              },
              connectionTimeout: 10000
            });

            await transporter.sendMail({
              from: `"${from_name || sender.label}" <${sender.email || sender.smtp_user}>`,
              to: recipient.email.trim(),
              subject: renderedSubject,
              text: renderedBody,
              html: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#1e293b;">${renderedBody.replace(/\n/g, '<br/>')}</div>`
            });
          }

          await supabase
            .from('recipients')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              sender_used: sender.email || sender.smtp_user
            })
            .eq('id', recipient.id);

          batchDispatchedCount++;
          totalDispatched++;
        } catch (sendErr: any) {
          failedSenders.add(sender.id || sender.email);
          await supabase
            .from('recipients')
            .update({
              status: 'failed',
              error_message: sendErr.message || 'SMTP dispatch error'
            })
            .eq('id', recipient.id);
        }
      }

      await supabase
        .from('campaigns')
        .update({
          daily_sent_count: currentDailySent + batchDispatchedCount,
          last_sent_date: todayDateStr
        })
        .eq('id', campaignId);

      auditLogs.push({
        campaignId,
        campaignName,
        status: 'dispatched_successfully',
        batchDispatchedCount,
        newDailyTotal: currentDailySent + batchDispatchedCount,
        dailyLimit: daily_limit
      });
    }

    return NextResponse.json({
      success: true,
      executionTimestamp: new Date().toISOString(),
      activeCampaignsCount: activeCampaigns.length,
      totalDispatched,
      executionTimeMs: Date.now() - startTime,
      auditLogs
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Fatal error in background dispatcher',
      executionTimeMs: Date.now() - startTime
    }, { status: 500 });
  }
}