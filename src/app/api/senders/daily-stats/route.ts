import { NextRequest, NextResponse } from 'next/server';
import { getAllSendersDailyCounts, getSenderDailySentCount } from '@/lib/supabase/emailLogs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (email) {
      const count = await getSenderDailySentCount(email);
      return NextResponse.json({
        success: true,
        email,
        countToday: count
      });
    }

    const counts = await getAllSendersDailyCounts();
    return NextResponse.json({
      success: true,
      counts
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch daily stats' },
      { status: 500 }
    );
  }
}
