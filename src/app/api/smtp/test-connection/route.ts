import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass } = await req.json();

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
    const errorMsg = err instanceof Error ? err.message : 'Unknown SMTP handshake error';
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 422 });
  }
}
