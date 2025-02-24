import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const publicRoutes = ['/login', '/signup', '/forgot-password']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')
  const isStaticRoute = req.nextUrl.pathname.startsWith('/_next') || 
                       req.nextUrl.pathname.startsWith('/static') ||
                       req.nextUrl.pathname === '/favicon.ico'

  // Skip middleware for static routes and API routes
  if (isStaticRoute || isApiRoute) {
    return res
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()

    // If user is not signed in and trying to access a protected route, redirect to login
    if (!session && !isPublicRoute) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and trying to access a public route, redirect to home
    if (session && isPublicRoute) {
      return NextResponse.redirect(new URL('/home', req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to proceed
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 