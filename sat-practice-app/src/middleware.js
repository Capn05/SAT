import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  // Get URL hash for Supabase auth detection
  // Note: middleware can't access hash directly, but we can check if there are auth params
  const url = req.nextUrl.clone();
  
  // Direct static HTML serving for root and welcome routes
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname === '/welcome') {
    // Don't rewrite root requests that might have auth tokens
    // Let the client-side code handle auth tokens
    const hasAuthParams = url.searchParams.has('access_token') || 
                         url.searchParams.has('refresh_token') ||
                         url.searchParams.has('type') ||
                         url.searchParams.has('error');
    
    // For root path with potential auth tokens, let the page component handle it
    if (req.nextUrl.pathname === '/' && (hasAuthParams || req.headers.get('referer')?.includes('supabase'))) {
      console.log('Potential auth token at root, skipping middleware rewrite');
      return NextResponse.next();
    }
    
    // Check if there's a recovery token in the URL
    const searchParams = req.nextUrl.searchParams;
    const hash = req.nextUrl.hash;

    // Handle both recovery tokens and error conditions
    if (
      searchParams.get('type') === 'recovery' || 
      searchParams.get('error') || 
      (hash && (hash.includes('type=recovery') || hash.includes('error=')))
    ) {
      // If there's a token or error, redirect to the appropriate page
      if (searchParams.get('error') || (hash && hash.includes('error='))) {
        // For error cases, redirect to forgot-password with the error
        url.pathname = '/forgot-password';
        if (hash) url.search = hash.replace('#', '?');
        return NextResponse.redirect(url);
      } else {
        // For normal recovery tokens, use the auth handler
        url.pathname = '/auth/handle-auth';
        return NextResponse.rewrite(url);
      }
    } else {
      // For normal visitors, serve the static HTML directly
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
    '/assets',
    '/api',
    '/favicon.ico',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/pricing',
    '/welcome',  // New landing page path
    '/privacy',  // Privacy policy page
    '/terms'     // Terms of use page
  ];
  
  // Special handling for auth callback
  if (req.nextUrl.pathname === '/auth/callback') {
    // Let the auth callback route handle the token processing
    return NextResponse.next();
  }
  
  if (bypassPaths.some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Only remaining paths are protected routes - check auth
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res }, {
    // Disable automatic refresh in middleware to prevent refresh loops
    auth: {
      autoRefreshToken: false,
      persistSession: true
    }
  });
  
  try {
    // Simple lightweight check without token refresh
    const { data, error } = await supabase.auth.getSession();
    
    // If there's a specific auth error (like invalid refresh token), clear the session
    if (error && (error.message?.includes('refresh_token_not_found') || error.message?.includes('invalid_grant'))) {
      console.log('Invalid refresh token detected, clearing session');
      // Clear the session and redirect to login
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    }
    
    // Only redirect if we're certain there's no session and no errors
    if (!data.session && !error) {
      console.log('User not authenticated, redirecting to login from:', req.nextUrl.pathname);
      const redirectUrl = new URL('/login', req.url);
      // Pass the original URL as a redirect parameter
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // If it's a rate limit error, let the request proceed to avoid cascading failures
    if (error.message?.includes('429') || error.message?.includes('rate')) {
      console.warn('Rate limit hit in middleware, allowing request to proceed');
      return res;
    }
    
    // For other errors, allow the request to proceed
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
     * - assets (public assets like images and videos)
     */
    '/((?!_next/static|_next/image|assets|favicon.ico).*)',
  ],
} 