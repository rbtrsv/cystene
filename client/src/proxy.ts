import { NextRequest, NextResponse } from 'next/server';

/**
 * Cookie names for authentication tokens
 * Must match the names from token.client.utils.ts
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'nudgio_access_token',
  REFRESH_TOKEN: 'nudgio_refresh_token',
  TOKEN_EXPIRY: 'nudgio_token_expiry',
};

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/pricing',
  '/logout',  // Allow access to logout page
  '/forgot-password',  // Allow password reset request
  '/reset-password',   // Allow password reset completion
  '/shopify',          // Embedded app routes use Shopify session token, not JWT cookies
];

/**
 * Routes that should redirect to dashboard if user is already authenticated
 */
const AUTH_ROUTES = [
  '/login',
  '/register'
];

/**
 * Check if the user is authenticated based on cookies
 * @param request NextRequest object
 * @returns boolean indicating if user is authenticated
 */
function isAuthenticated(request: NextRequest): boolean {
  const accessToken = request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
  const refreshToken = request.cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
  const tokenExpiry = request.cookies.get(COOKIE_NAMES.TOKEN_EXPIRY);

  // If no tokens, definitely not authenticated
  if (!accessToken || !refreshToken) {
    return false;
  }

  // If no expiry, assume token is valid
  if (!tokenExpiry) {
    return true;
  }

  // Check if token is expired
  try {
    const expiryDate = new Date(tokenExpiry.value);
    const isExpired = expiryDate <= new Date();
    return !isExpired;
  } catch (error) {
    // If we can't parse expiry, assume expired
    console.error('Failed to parse token expiry date:', error);
    return false;
  }
}

/**
 * Check if a path is a public route
 * @param pathname The pathname to check
 * @returns boolean indicating if the route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check if a path is an auth route (login/register)
 * @param pathname The pathname to check
 * @returns boolean indicating if the route is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Middleware function for handling authentication-based route protection
 * @param request NextRequest object
 * @returns NextResponse or redirect
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = isAuthenticated(request);

  // If user is authenticated and trying to access auth routes, redirect to home
  if (authenticated && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!authenticated && !isPublicRoute(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

/**
 * Matcher configuration for the middleware
 * Apply to all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
