import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  let smtpHost = '';
  let smtpPort = '';
  let smtpUser = '';
  let smtpPass = '';

  try {
    const body = await req.json();
    smtpHost = body.smtpHost || '';
    smtpPort = body.smtpPort || '';
    smtpUser = body.smtpUser || '';
    smtpPass = body.smtpPass || '';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return NextResponse.json({
        success: false,
        error: 'Missing required SMTP credentials (host, port, user, or pass).'
      }, { status: 400 });
    }

    const port = Number(smtpPort);
    const isSecure = port === 465;

    const transporter = nodemailer.createTransport({
      host: smtpHost.trim(),
      port,
      secure: isSecure,
      auth: {
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
      },
      connectionTimeout: 10000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: `Handshake successful: Connected to ${smtpHost}:${port} and authenticated as ${smtpUser}.`
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    const hostLower = String(smtpHost || '').toLowerCase();
    let userFriendlyMsg = rawMsg;

    if (rawMsg.includes('535') || rawMsg.includes('Username and Password not accepted') || rawMsg.includes('Invalid login') || rawMsg.includes('auth')) {
      if (hostLower.includes('gmail') || hostLower.includes('google')) {
        userFriendlyMsg = 'Google Workspace / Gmail Auth Failed (535): Google requires a 16-character App Password (not your personal Google account password). Go to myaccount.google.com > Security > 2-Step Verification > App Passwords to create one.';
      } else if (hostLower.includes('hostinger') || hostLower.includes('titan')) {
        userFriendlyMsg = 'Hostinger / Titan Auth Failed (535): Incorrect email or mailbox password. Ensure you use your full email address and the mailbox password configured in Hostinger hPanel.';
      } else if (hostLower.includes('outlook') || hostLower.includes('office365')) {
        userFriendlyMsg = 'Microsoft 365 / Outlook Auth Failed (535): Ensure Authenticated SMTP is enabled for this user in Microsoft 365 Admin Center, or generate an App Password.';
      } else {
        userFriendlyMsg = `SMTP Authentication Failed (535): The mail server rejected your username or password. Please verify your credentials for ${smtpHost}.`;
      }
    } else if (rawMsg.includes('ETIMEDOUT') || rawMsg.includes('ECONNREFUSED') || rawMsg.includes('timeout')) {
      userFriendlyMsg = `SMTP Connection Timeout: Unable to connect to ${smtpHost} on port ${smtpPort}. Try switching between Port 465 (SSL) and Port 587 (TLS), or check your firewall.`;
    } else if (rawMsg.includes('ENOTFOUND') || rawMsg.includes('EAI_AGAIN')) {
      userFriendlyMsg = `DNS Resolution Failed: Could not resolve SMTP Host "${smtpHost}". Please verify the server hostname.`;
    }

    return NextResponse.json({
      success: false,
      error: userFriendlyMsg,
      rawError: rawMsg
    }, { status: 422 });
  }
}
