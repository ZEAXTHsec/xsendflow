import { NextRequest, NextResponse } from 'next/server';

// 1x1 Transparent GIF Byte Buffer
const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recipientId = decodeURIComponent(id || '');

    // Optional: Log open event into Supabase / local analytics in background
    console.log(`[+] [Email Open Tracker] Recipient ${recipientId} opened email at ${new Date().toISOString()}`);

    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch {
    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      status: 200,
      headers: { 'Content-Type': 'image/gif' },
    });
  }
}
