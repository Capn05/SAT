import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  // Handle password reset flow
  if (type === 'recovery') {
    // For password reset, redirect to the reset password page
    const response = NextResponse.redirect(new URL('/reset-password', request.url))
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    
    // Forward all query parameters to ensure the token is preserved
    const searchParams = requestUrl.searchParams
    response.url = response.url + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    
    return response
  }

  if (code) {
    try {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      await supabase.auth.exchangeCodeForSession(code)
      
      // Add cache headers to prevent caching this redirect
      const response = NextResponse.redirect(new URL('/home', request.url))
      response.headers.set('Cache-Control', 'no-store, max-age=0')
      return response
    } catch (error) {
      console.error('Auth callback error:', error)
      // Redirect to login on error
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.headers.set('Cache-Control', 'no-store, max-age=0')
      return response
    }
  }

  // No code, just redirect to home
  const response = NextResponse.redirect(new URL('/home', request.url))
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  return response
} 