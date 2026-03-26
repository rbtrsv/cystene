import { NextRequest } from 'next/server';
import { updateSession } from '@/modules/accounts/utils/supabase/supabase-middleware';
import { checkRateLimit } from '@/modules/security';

export async function proxy(request: NextRequest) {
  // Check rate limit first
  const rateLimitResponse = checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;
  
  // Then check authentication
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - / (homepage)
     * Note: /accounts routes are included so rate limiting runs on login/signup
     * updateSession handles them safely (only redirects on /dashboard)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|^$).*)',
  ],
}