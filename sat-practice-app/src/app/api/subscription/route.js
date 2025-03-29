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
    
    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' }, 
        { status: 404 }
      );
    }
    
    // Ensure there's a valid Stripe subscription ID
    if (!subscription.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'Invalid subscription record' }, 
        { status: 400 }
      );
    }
    
    try {
      // Cancel the subscription in Stripe
      const canceledSubscription = await stripe.subscriptions.cancel(
        subscription.stripe_subscription_id
      );
      
      // Update the subscription status in our database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
      
      if (updateError) {
        console.error('Error updating subscription status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription status' }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        message: 'Subscription canceled successfully',
        canceled_at: canceledSubscription.canceled_at
      }, { status: 200 });
      
    } catch (stripeError) {
      console.error('Stripe error when canceling subscription:', stripeError);
      return NextResponse.json(
        { error: 'Failed to cancel subscription with Stripe' }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' }, 
      { status: 500 }
    );
  }
} 