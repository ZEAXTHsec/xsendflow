import { NextRequest, NextResponse } from 'next/server';
import { inspectDomainDNS, getDnsSetupTemplates } from '@/lib/dnsInspector';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { domain } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const health = await inspectDomainDNS(domain);
    const templates = getDnsSetupTemplates(health.domain);

    return NextResponse.json({
      health,
      templates
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to inspect domain DNS';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
