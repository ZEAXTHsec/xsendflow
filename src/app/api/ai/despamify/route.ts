import { NextRequest, NextResponse } from 'next/server';
import { analyzeSpamRisk, deSpamifyText } from '@/lib/spamWords';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (typeof text !== 'string') {
      return NextResponse.json({ error: 'Text string is required' }, { status: 400 });
    }

    const { cleanedText, replacementCount } = deSpamifyText(text);
    const beforeAnalysis = analyzeSpamRisk(text);
    const afterAnalysis = analyzeSpamRisk(cleanedText);

    return NextResponse.json({
      originalText: text,
      cleanedText,
      replacementCount,
      before: beforeAnalysis,
      after: afterAnalysis
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to despamify text';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
