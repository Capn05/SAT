import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Initialize Stripe with secret key
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }
    
    // Fetch the user's subscription data
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' }, 
        { status: 500 }
      );
    }
    
    // If no subscription found
    if (!subscription) {
      return NextResponse.json(
        { subscription: null },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ subscription }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
}

// New DELETE endpoint for canceling a subscription
export async function DELETE(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    console.log('Starting subscription cancellation process');
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.json(
        { error: 'User not authenticated' }, 
        { status: 401 }
      );
    }
    
    console.log('Authenticated user ID:', user.id);
    
    // Fetch the user's subscription data
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription data: ' + subscriptionError.message }, 
        { status: 404 }
      );
    }
    
    if (!subscription) {
      console.log('No subscription found for user:', user.id);
      return NextResponse.json(
        { error: 'No active subscription found' }, 
        { status: 404 }
      );
    }
    
    console.log('Found subscription:', JSON.stringify({
      id: subscription.id,
      status: subscription.status,
      stripe_id: subscription.stripe_subscription_id,
    }));
    
    // Ensure there's a valid Stripe subscription ID
    if (!subscription.stripe_subscription_id) {
      console.error('Missing Stripe subscription ID');
      return NextResponse.json(
        { error: 'Invalid subscription record: Missing Stripe subscription ID' }, 
        { status: 400 }
      );
    }
    
    try {
      console.log('Attempting to cancel Stripe subscription:', subscription.stripe_subscription_id);
      
      // Check if Stripe is properly initialized
      if (!stripe) {
        console.error('Stripe is not properly initialized');
        return NextResponse.json(
          { error: 'Payment service unavailable' }, 
          { status: 500 }
        );
      }
      
      if (!stripe.subscriptions) {
        console.error('Stripe subscriptions API not available');
        return NextResponse.json(
          { error: 'Payment service configuration error' }, 
          { status: 500 }
        );
      }
      
      // Cancel at period end instead of immediately
      const canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        { cancel_at_period_end: true }
      );
      
      console.log('Stripe cancellation successful, subscription will end at period end');
      
      // Update the subscription status in our database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
      
      if (updateError) {
        console.error('Error updating subscription status in database:', updateError);
        return NextResponse.json(
          { error: 'Subscription canceled in Stripe but failed to update status in database' }, 
          { status: 500 }
        );
      }
      
      console.log('Subscription cancellation completed successfully');
      
      return NextResponse.json({ 
        message: 'Subscription canceled successfully',
        canceled_at: new Date().toISOString(),
        current_period_end: canceledSubscription.current_period_end 
          ? new Date(canceledSubscription.current_period_end * 1000).toISOString() 
          : subscription.current_period_end
      }, { status: 200 });
      
    } catch (stripeError) {
      console.error('Stripe error details:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to cancel subscription with payment provider',
          details: stripeError.message
        }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Unexpected error during subscription cancellation:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error.message
      }, 
      { status: 500 }
    );
  }
} 