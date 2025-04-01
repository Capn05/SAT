import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  // Skip middleware for these paths to prevent auth loops and token refreshes
  const bypassPaths = [
    '/auth/callback', 
    '/_next', 
    '/static', 
    '/api',
    '/favicon.ico',
    '/login',
    '/signup',
    '/forgot-password',
    '/pricing'
  ];
  
  if (bypassPaths.some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Root path (/) now serves the landing page directly through next.config.mjs rewrites
  // so we just need to let it pass through
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }
  
  // Landing pages should bypass auth check (keeping this for backward compatibility)
  if (req.nextUrl.pathname === '/landing' || req.nextUrl.pathname.startsWith('/landing/')) {
    return NextResponse.next();
  }
  
  // Only remaining paths are protected routes - check auth
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    // Simple lightweight check without token refresh
    const { data, error } = await supabase.auth.getUser();
    
    // Only redirect if we're certain there's no user
    if (!data.user && !error) {
      console.log('User not authenticated, redirecting to login from:', req.nextUrl.pathname);
      const redirectUrl = new URL('/login', req.url);
      // Pass the original URL as a redirect parameter
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow the request to proceed
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image).*)',
  ],
} 