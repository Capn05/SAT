import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Get a Supabase client for database operations
  const supabase = createRouteHandlerClient({ cookies });

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Extract customer info from the session
      const customerId = session.customer;
      const customerEmail = session.customer_details.email;
      
      // Get the user associated with this email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail)
        .single();
      
      if (userError) {
        console.error('Error finding user:', userError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Store subscription info in the database
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userData.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: session.subscription,
          status: 'active',
          plan_type: session.metadata.plan_type,
          current_period_end: new Date(session.subscription.current_period_end * 1000),
        });
      
      if (subscriptionError) {
        console.error('Error storing subscription:', subscriptionError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      
      break;
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      
      // Get the customer_id to find the user
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();
      
      if (subError) {
        console.error('Error finding subscription:', subError);
        return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
      }
      
      // Update subscription status in the database
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000),
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
} 