import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  let endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // Verify the event came from Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle specific event types
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Get customer details from the session
      const customerEmail = session.customer_details.email;
      const customerId = session.customer;
      const paymentStatus = session.payment_status;
      
      if (paymentStatus !== 'paid') {
        return NextResponse.json({ message: 'Payment not completed yet' });
      }

      // Find the user by email
      const { data: userData, error: userError } = await supabaseAdmin
        .from('auth.users')
        .select('id')
        .eq('email', customerEmail)
        .single();

      if (userError || !userData) {
        console.error('User not found:', customerEmail, userError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userId = userData.id;
      
      // Determine subscription details from metadata or line items
      // This is just an example - adjust based on your Stripe setup
      let planType = 'monthly';
      let expiresAt = new Date();
      
      // For monthly plan: add 1 month
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      // Check for 6-month plan based on line items or metadata
      // Assuming you set metadata for plan type
      if (session.metadata && session.metadata.plan_type === 'six_month') {
        planType = 'six_month';
        expiresAt.setMonth(expiresAt.getMonth() + 5); // Total of 6 months
      }

      // Insert or update subscription record
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: session.subscription || null,
          plan_type: planType,
          status: 'active',
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
    }
  } else if (event.type === 'customer.subscription.deleted') {
    // Handle subscription cancellation/expiration
    const subscription = event.data.object;
    
    try {
      // Update the subscription status to inactive
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString() 
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating subscription status:', error);
        return NextResponse.json({ error: 'Error updating subscription status' }, { status: 500 });
      }

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
    }
  }

  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
} 