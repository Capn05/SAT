import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/app/lib/stripe';
import { createClient } from '@/app/lib/supabase/server';

// This is your Stripe webhook secret for testing your endpoint locally.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error(`⚠️ Webhook signature verification failed.`, err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed.` },
        { status: 400 }
      );
    }

    // Handle the event
    const supabase = createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planType = session.metadata.planType;
        const subscriptionId = session.subscription;

        // Update the user's subscription status in your database
        const { error } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            plan_type: planType,
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          });

        if (error) {
          console.error('Error updating subscription status:', error);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Find the user with this subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (subscriptionError || !subscriptionData) {
          console.error('Error finding subscription:', subscriptionError);
          break;
        }

        // Update the subscription end date
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            current_period_end: subscription.current_period_end,
            status: subscription.status,
          })
          .eq('stripe_subscription_id', subscriptionId);

        if (error) {
          console.error('Error updating subscription period:', error);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Update the subscription in your database
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_end: subscription.current_period_end,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Update the subscription status to canceled
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error canceling subscription:', error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 