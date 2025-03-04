import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { getUserSubscription } from './subscription';

/**
 * Middleware to protect routes that require a subscription
 * @param {Object} request - The request object
 * @param {string} requiredPlan - The required plan ('basic' or 'premium')
 * @returns {Promise<NextResponse>} - The response
 */
export async function subscriptionMiddleware(request, requiredPlan = 'basic') {
  try {
    // Get the user from the session
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const userId = session.user.id;
    
    // Check if the user has an active subscription
    const { isSubscriptionActive, planType } = await getUserSubscription(userId);
    
    // If no subscription is required, or if the user has the required plan, allow access
    if (requiredPlan === 'free') {
      return NextResponse.next();
    }
    
    // If the user doesn't have an active subscription, redirect to pricing
    if (!isSubscriptionActive) {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
    
    // If premium is required but the user only has basic, redirect to pricing
    if (requiredPlan === 'premium' && planType !== 'premium') {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
    
    // Allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Error in subscription middleware:', error);
    // In case of error, redirect to pricing
    return NextResponse.redirect(new URL('/pricing', request.url));
  }
} 