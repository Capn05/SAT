import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

// MIDDLEWARE FOR PROTECTED ROUTES
export async function authMiddleware(req) {
  const res = NextResponse.next()
  
  // Add throttling for refresh token requests
  const refreshHeader = req.headers.get('x-supabase-auth-refresh');
  if (refreshHeader === 'throttled') {
    // Don't attempt another refresh
    return res;
  }
  
  const supabase = createMiddlewareClient({ req, res })

  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error && error.status === 429) {
      // Rate limit hit, add a header to prevent further refresh attempts
      res.headers.set('x-supabase-auth-refresh', 'throttled')
      // Continue with the request even if auth failed due to rate limit
      return res
    }

    // If user is not signed in, redirect to login
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Auth middleware error:', error)
    // On error, allow the request to proceed
    return res
  }
}

// MIDDLEWARE FOR PUBLIC ROUTES
export async function publicMiddleware(req) {
  const res = NextResponse.next()
  
  // For root path, just redirect to landing without auth check
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/landing/index.html', req.url))
  }
  
  // For login/signup pages, only check if user is already logged in
  // to redirect them away - no need for full session validation
  const supabase = createMiddlewareClient({ req, res })
  
  try {
    // Use a lightweight session check that doesn't trigger token refresh
    const { data } = await supabase.auth.getSession()
    const hasSession = Boolean(data?.session?.user)
    
    // If there's an active session and user is on login/signup pages,
    // redirect to home
    if (hasSession && 
        req.nextUrl.pathname !== '/landing' && 
        !req.nextUrl.pathname.startsWith('/landing/')) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
    
    return res
  } catch (error) {
    console.error('Public middleware error:', error)
    return res
  }
}

// Main middleware function that routes to either auth or public middleware
export async function middleware(req) {
  // Handle static and API routes first
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')
  const isStaticRoute = req.nextUrl.pathname.startsWith('/_next') || 
                       req.nextUrl.pathname.startsWith('/static') ||
                       req.nextUrl.pathname === '/favicon.ico'

  // Skip middleware for static routes and API routes
  if (isStaticRoute || isApiRoute) {
    return NextResponse.next()
  }
  
  // Define protected and public routes
  const publicPaths = ['/login', '/signup', '/forgot-password', '/landing', '/']
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path)
  )
  
  // Route to appropriate middleware based on path
  if (isPublicPath) {
    return publicMiddleware(req)
  } else {
    return authMiddleware(req)
  }
}

export const config = {
  matcher: [
    // Protected routes that need auth checking
    '/home/:path*',
    '/profile/:path*',
    '/practice/:path*',
    // Public routes
    '/',
    '/login',
    '/signup',
    '/landing/:path*',
    '/forgot-password'
  ],
} 