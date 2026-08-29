import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putztvsdxuprkbxufrge.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzQ4MjIsImV4cCI6MjA5ODgxMDgyMn0.b2Xla5rxDtSYlF9pcouQS8do0LdXK_OKVeiW3w0PeJo';

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Check if any auth cookies exist
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(c => c.name.startsWith('sb-') && c.name.includes('auth-token'));
  const mockCookie = request.cookies.get('xsendflow_mock_session')?.value;

  // Refresh auth session
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {}

  const isProtectedPath = request.nextUrl.pathname.startsWith('/studio');

  // If user is unauthenticated and tries to access /studio, redirect to login
  if (isProtectedPath && !user && !hasAuthCookie && !mockCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
