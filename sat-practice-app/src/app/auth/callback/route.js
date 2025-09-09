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
      const { data } = await supabase.auth.exchangeCodeForSession(code)
      
      // Check if this is a new user and if they have an approved domain email
      if (data?.user && data?.user?.email) {
        const approvedDomains = ['@bentonvillek12.org', '@knilok.com', '@inupup.com'];
        const isApprovedStudent = approvedDomains.some(domain => data.user.email.toLowerCase().endsWith(domain));
        
        if (isApprovedStudent) {
          // Check if user already has a subscription
          const { data: existingSubscription, error: subError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', data.user.id)
            .single();
          
          // If no existing subscription, create a free one using our API
          if (subError && subError.code === 'PGRST116') { // No rows returned
            try {
              // Call our API to create the subscription with proper permissions
              const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/create-free-subscription`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: data.user.id,
                  userEmail: data.user.email
                }),
              });

              const result = await response.json();

              if (response.ok) {
                console.log('Free subscription created for approved domain user:', data.user.email);
              } else {
                console.error('Error creating free subscription for OAuth user:', result);
              }
            } catch (subscriptionError) {
              console.error('Error creating free subscription for OAuth user:', subscriptionError);
            }
          }
        }
      }
      
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