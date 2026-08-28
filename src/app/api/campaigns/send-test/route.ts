import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { sender, to, subject, body } = await req.json();

    if (!sender || !to || !subject || !body) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters (sender, to, subject, or body).'
      }, { status: 400 });
    }

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
      connectionTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"${sender.fromName || sender.label || 'XSendFlow'}" <${sender.email || sender.smtpUser}>`,
      to: to.trim(),
      subject: subject.trim(),
      text: body.trim(),
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      envelope: info.envelope,
      message: `Email successfully delivered to ${to}`
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send email';
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
