import { NextRequest, NextResponse } from 'next/server';

// Rate limit storage
const requests = new Map<string, { count: number; resetTime: number }>();

// Rate limit configurations per route
const RATE_LIMITS = {
  auth: { requests: 10, windowMs: 60 * 1000 },      // 10 login/signup attempts per minute
  api: { requests: 50, windowMs: 60 * 1000 },       // 50 API calls per minute
  dashboard: { requests: 200, windowMs: 60 * 1000 }, // 200 dashboard requests per minute
  default: { requests: 100, windowMs: 60 * 1000 },   // Default limit
};

function getRateLimitConfig(pathname: string) {
  // Auth pages — brute force protection
  if (pathname.startsWith('/accounts/login') || pathname.startsWith('/accounts/signup')) return RATE_LIMITS.auth;
  // API routes
  if (pathname.startsWith('/api/')) return RATE_LIMITS.api;
  // Dashboard pages
  if (pathname.startsWith('/dashboard')) return RATE_LIMITS.dashboard;
  return RATE_LIMITS.default;
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip = getClientIP(request);
  const config = getRateLimitConfig(request.nextUrl.pathname);
  const now = Date.now();
  
  // Clean up old entries occasionally (1% chance)
  if (Math.random() < 0.01) {
    for (const [key, record] of requests.entries()) {
      if (now > record.resetTime) {
        requests.delete(key);
      }
    }
  }
  
  const userRecord = requests.get(ip);
  
  // No record or window expired - create new record
  if (!userRecord || now > userRecord.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + config.windowMs });
    return null; // Allow request
  }
  
  // Check if rate limit exceeded
  if (userRecord.count >= config.requests) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Rate limit exceeded', 
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000)
      }), 
      { 
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'Retry-After': Math.ceil((userRecord.resetTime - now) / 1000).toString(),
        }
      }
    );
  }
  
  // Increment count and allow request
  userRecord.count++;
  return null;
}
