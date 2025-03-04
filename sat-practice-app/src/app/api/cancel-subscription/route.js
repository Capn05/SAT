import { NextResponse } from 'next/server';
import stripe from '@/app/lib/stripe';
import { createClient } from '@/app/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get the user's subscription from the database
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }
    
    // Cancel the subscription in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
    
    // Update the subscription status in the database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
      })
      .eq('id', subscription.id);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Error updating subscription' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Subscription will be canceled at the end of the billing period',
      subscription: {
        ...subscription,
        cancel_at_period_end: true,
      },
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Error canceling subscription' },
      { status: 500 }
    );
  }
} 