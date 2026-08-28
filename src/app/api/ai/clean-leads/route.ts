import { NextRequest, NextResponse } from 'next/server';
import { sanitizeFirstName, sanitizeCompanyName, sanitizeJobTitle, isRoleBasedEmail, isValidEmailFormat, generateLocalIcebreaker, createSlug } from '@/lib/sanitizer';
import { Lead } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leads } = body as { leads: Partial<Lead>[] };

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'Valid leads array required' }, { status: 400 });
    }

    const cleanedLeads: Lead[] = [];

    for (let i = 0; i < leads.length; i++) {
      const raw = leads[i];
      const rawFirstName = (raw.rawFirstName || raw.cleanFirstName || '').trim();
      const rawCompany = (raw.rawCompany || raw.cleanCompany || '').trim();
      const rawTitle = (raw.rawTitle || raw.cleanTitle || '').trim();
      const email = (raw.email || '').trim();

      const cleanFirstName = sanitizeFirstName(rawFirstName);
      const cleanCompany = sanitizeCompanyName(rawCompany);
      const cleanTitle = sanitizeJobTitle(rawTitle);
      const isRoleEmail = isRoleBasedEmail(email);
      const isValidEmail = isValidEmailFormat(email);
      const slug = createSlug(cleanFirstName, cleanCompany);
      const pitchUrl = `${req.nextUrl.origin}/p/${slug}`;

      // Icebreaker logic
      let icebreaker = raw.icebreaker || '';
      if (!icebreaker) {
        icebreaker = generateLocalIcebreaker(cleanFirstName || 'there', cleanCompany || 'your company', cleanTitle);
      }

      cleanedLeads.push({
        id: raw.id || `lead-${Date.now()}-${i}`,
        rawFirstName,
        rawLastName: raw.rawLastName || '',
        rawCompany,
        rawTitle,
        email,
        cleanFirstName,
        cleanCompany,
        cleanTitle,
        icebreaker,
        isRoleEmail,
        isValidEmail,
        pitchSlug: slug,
        pitchUrl,
        status: isValidEmail ? 'cleaned' : 'error'
      });
    }

    return NextResponse.json({ leads: cleanedLeads });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to clean leads';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
