import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  // Direct static HTML serving for root and welcome routes
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/welcome') {
    // Check if there's a recovery token in the URL
    const searchParams = req.nextUrl.searchParams;
    const hash = req.nextUrl.hash;

    // Handle both recovery tokens and error conditions
    if (
      searchParams.get('type') === 'recovery' || 
      (hash && hash.includes('type=recovery')) ||
      searchParams.get('error') || 
      (hash && hash.includes('error='))
    ) {
      // If there's a token or error, redirect to the appropriate page
      if (hash && hash.includes('error=')) {
        // For error cases, redirect to forgot-password with the error
        const url = req.nextUrl.clone();
        url.pathname = '/forgot-password';
        url.search = hash.replace('#', '?');
        return NextResponse.redirect(url);
      } else {
        // For normal recovery tokens, use the auth handler
        const url = req.nextUrl.clone();
        url.pathname = '/auth/handle-auth';
        return NextResponse.rewrite(url);
      }
    } else {
      // For normal visitors, serve the static HTML directly
      const url = req.nextUrl.clone();
      url.pathname = '/index.html';
      return NextResponse.rewrite(url);
    }
  }

  // Skip middleware for these paths to prevent auth loops and token refreshes
  const bypassPaths = [
    '/auth/callback', 
    '/auth/reset-redirect',
    '/auth/handle-auth',
    '/_next', 
    '/static', 
    '/api',
    '/favicon.ico',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/pricing',
    '/welcome'  // New landing page path
  ];
  
  if (bypassPaths.some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path))) {
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