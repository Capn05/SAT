import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

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