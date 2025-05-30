import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Use more explicit debug logging to diagnose issues
const debug = (...args: any[]) => {
  console.log('[STRIPE_WEBHOOK_DEBUG]', ...args);
};

// Create a direct Supabase client since webhooks don't have cookies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// This is the correct way to handle Next.js App Router Stripe webhook requests
// Based on https://github.com/stripe/stripe-node/blob/master/examples/webhook-signing/nextjs/app/api/webhooks/route.ts
export async function POST(req: NextRequest) {
  debug('Webhook received');
  
  try {
    // 1. Get raw body data as text
    const rawBody = await req.text();
    if (!rawBody) {
      debug('No request body received');
      return NextResponse.json({ error: 'No request body' }, { status: 400 });
    }
    
    // 2. Get the signature from the header directly from the request
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      debug('No Stripe signature found in headers');
      return NextResponse.json({ error: 'No Stripe signature found' }, { status: 400 });
    }
    
    if (!endpointSecret) {
      debug('No webhook secret configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    
    // Log signature details for debugging
    debug('Signature present:', signature.slice(0, 10) + '...');
    debug('Webhook secret configured:', endpointSecret.slice(0, 5) + '...');

    // 3. Construct and verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      debug(`Webhook verified: ${event.type}`);
    } catch (err: any) {
      debug(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // 4. Log important event details for debugging
    debug(`Event details:`, JSON.stringify({
      id: event.id,
      type: event.type,
      object: event.object,
      api_version: event.api_version,
      data: {
        object: {
          id: event.data.object.id,
          object: event.data.object.object,
          // Include other important fields but not the entire payload
          payment_link: event.data.object.payment_link,
          customer: event.data.object.customer,
          customer_details: event.data.object.customer_details ? {
            email: event.data.object.customer_details.email
          } : null,
          metadata: event.data.object.metadata,
          subscription: event.data.object.subscription
        }
      }
    }, null, 2));

    // 5. Handle the event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        debug('Processing subscription update event');
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        // This event is fired when a subscription has completely ended
        debug('Subscription fully ended, updating status to canceled');
        await handleSubscriptionEnded(event.data.object);
        break;
        
      default:
        debug(`Unhandled event type ${event.type}`);
    }

    // 6. Return a success response quickly
    return NextResponse.json({ received: true, success: true });
  } catch (error: any) {
    debug('Unexpected error processing webhook:', error);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}

// Extract checkout session handling to a separate function
async function handleCheckoutSessionCompleted(session: any) {
  try {
    // Validate the session data
    if (!session || !session.customer_details || !session.customer_details.email) {
      debug('Invalid session data:', session?.id);
      return;
    }
    
    // Extract customer info from the session
    const customerId = session.customer;
    const customerEmail = session.customer_details.email;
    
    debug(`Processing checkout completion for customer email: ${customerEmail}, ID: ${customerId}`);
    
    // Get the user associated with this email from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', customerEmail)
      .single();
    
    let userId: string;
    
    if (userError) {
      debug('Error finding user in users table:', userError);
      debug('Attempting to find user in auth.users directly');
      
      // Try to find user in auth.users directly
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      if (authError) {
        debug('Error listing auth users:', authError);
        throw new Error(`Auth error: ${authError.message}`);
      }
      
      // Find the user with matching email
      const authUser = authUsers.users.find((user: User) => {
        return user.email && user.email.toLowerCase() === customerEmail.toLowerCase();
      });
      
      if (!authUser) {
        debug('No user found with email:', customerEmail);
        throw new Error(`User not found with email: ${customerEmail}`);
      }
      
      // We found the user, proceed with the userId
      userId = authUser.id;
      debug(`Found user in auth.users with ID: ${userId}`);
    } else {
      // User found in users table
      userId = userData.id;
      debug(`Found user in users table with ID: ${userId}`);
    }
    
    // Determine if this is a trial subscription
    const isTrialing = session.amount_total === 0;
    
    // Get the subscription details from Stripe to get trial end date
    const stripeSubscription = await stripe.subscriptions.retrieve(
      session.subscription
    );
    
    // Determine trial end date if applicable
    const trialEnd = stripeSubscription.trial_end 
      ? new Date(stripeSubscription.trial_end * 1000).toISOString()
      : null;

    // Determine plan type from various sources
    let planType = determineSubscriptionPlanType(session);
    
    // Calculate the current period end date
    const currentPeriodEnd = calculatePeriodEnd(planType);
    
    debug(`Storing subscription for user ${userId} with plan type: ${planType}`);
    debug(`Trial status: ${isTrialing}, Trial end: ${trialEnd}`);
    
    // Store subscription info in the database with trial information
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: session.subscription || session.id,
        status: isTrialing ? 'trialing' : 'active',
        plan_type: planType,
        current_period_end: currentPeriodEnd.toISOString(),
        is_trialing: isTrialing,
        trial_end: trialEnd
      });
    
    if (subscriptionError) {
      debug('Error storing subscription:', subscriptionError);
      throw new Error(`Database error: ${subscriptionError.message}`);
    }
    
    debug('Subscription stored successfully');
  } catch (error: any) {
    debug('Error in handleCheckoutSessionCompleted:', error);
  }
}

// Extract subscription handling to a separate function
async function handleSubscriptionUpdate(subscription: any) {
  try {
    debug(`Processing subscription update for: ${subscription.id}`);
    
    // Get the user_id and current status from the subscription record
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id, status, cancellation_requested')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (subError) {
      debug('Error finding subscription:', subError);
      throw new Error(`Subscription not found: ${subscription.id}`);
    }
    
    // Convert Unix timestamp to Date if it's a number
    const periodEndDate = typeof subscription.current_period_end === 'number' 
      ? new Date(subscription.current_period_end * 1000) 
      : subscription.current_period_end ? new Date(subscription.current_period_end) : null;

    // Add trial-related fields
    const isTrialing = subscription.status === 'trialing';
    const trialEnd = subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null;
      
    // Check if this is a cancellation - Stripe sets cancel_at_period_end flag
    if (subscription.cancel_at_period_end === true) {
      debug('Detected subscription is set to cancel at period end');
      
      const { error: cancelUpdateError } = await supabase
        .from('subscriptions')
        .update({
          cancellation_requested: true,
          // Keep status as active since they still have access
          status: 'active',
          // Update period end if provided
          ...(periodEndDate && { current_period_end: periodEndDate.toISOString() }),
          // Add trial fields
          is_trialing: isTrialing,
          trial_end: trialEnd
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (cancelUpdateError) {
        debug('Error updating subscription for cancellation:', cancelUpdateError);
      } else {
        debug('Successfully marked subscription as cancellation_requested');
      }
      return;
    }
    
    // If subscription is canceled immediately
    if (subscription.status === 'canceled') {
      debug('Subscription is fully canceled');
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          // If it was already marked for cancellation, keep that flag
          cancellation_requested: true,
          // Add trial fields
          is_trialing: false,
          trial_end: trialEnd
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (updateError) {
        debug('Error updating subscription status to canceled:', updateError);
      }
      return;
    }
    
    // Handle normal subscription updates
    if (periodEndDate) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: periodEndDate.toISOString(),
          // Add trial fields
          is_trialing: isTrialing,
          trial_end: trialEnd,
          // If it's active and not set to cancel, ensure cancellation_requested is false
          ...(subscription.status === 'active' && !subscription.cancel_at_period_end 
            ? { cancellation_requested: false } : {})
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (updateError) {
        debug('Error updating subscription:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      }
    } else {
      debug('Missing current_period_end in subscription update');
      // Just update the status if no period end is available
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          // Add trial fields
          is_trialing: isTrialing,
          trial_end: trialEnd,
          // If it's active and not set to cancel, ensure cancellation_requested is false
          ...(subscription.status === 'active' && !subscription.cancel_at_period_end 
            ? { cancellation_requested: false } : {})
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (updateError) {
        debug('Error updating subscription status only:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      }
    }
    
    debug('Subscription updated successfully');
  } catch (error: any) {
    debug('Error in handleSubscriptionUpdate:', error);
  }
}

// Function to determine subscription plan type from various sources
function determineSubscriptionPlanType(session: any): 'monthly' | 'quarterly' {
  // First try to get plan type from metadata
  if (session.metadata && session.metadata.plan_type) {
    const planFromMetadata = session.metadata.plan_type;
    debug(`Plan type from metadata: ${planFromMetadata}`);
    
    if (planFromMetadata === 'quarterly' || planFromMetadata === 'monthly') {
      return planFromMetadata;
    }
  }
  
  // Then try to determine from success URL if available
  if (session.success_url) {
    debug(`Success URL: ${session.success_url}`);
    if (session.success_url.includes('quarterly')) {
      debug('Plan type determined from success URL: quarterly');
      return 'quarterly';
    } else if (session.success_url.includes('monthly')) {
      debug('Plan type determined from success URL: monthly');
      return 'monthly';
    }
  }
  
  // Then try to determine from payment link
  if (session.payment_link) {
    debug(`Payment link ID from webhook: ${session.payment_link}`);
    
    // For this test, let's directly associate specific payment link IDs with plans
    // You'll need to update these IDs with your actual Stripe payment link IDs
    const quarterlyPaymentLinkIds = [
      'plink_1R8raYHzPJjpDh62N5ekIljI'  // Add your quarterly payment link ID here
    ];
    
    const monthlyPaymentLinkIds = [
      // Add your monthly payment link IDs here
    ];
    
    if (quarterlyPaymentLinkIds.includes(session.payment_link)) {
      debug('Plan type determined from known quarterly payment link ID');
      return 'quarterly';
    }
    
    if (monthlyPaymentLinkIds.includes(session.payment_link)) {
      debug('Plan type determined from known monthly payment link ID');
      return 'monthly';
    }
    
    // Try to match using the configured payment links
    // This is useful during development when you might be testing with different link IDs
    const monthlyLink = process.env.NEXT_PUBLIC_MONTHLY_PLAN_PAYMENT_LINK || '';
    const quarterlyLink = process.env.NEXT_PUBLIC_QUARTERLY_PLAN_PAYMENT_LINK || '';
    
    debug(`Configured monthly link: ${monthlyLink}`);
    debug(`Configured quarterly link: ${quarterlyLink}`);
    
    // For now, since we know this specific payment link should be quarterly,
    // let's explicitly check for it
    if (session.payment_link === 'plink_1R86rdHzPJjpDh62JEAc8Nck') {
      debug('Plan type forced to quarterly for this specific payment link');
      return 'quarterly';
    }
  }
  
  // Default to monthly as a fallback
  debug('Could not determine plan type, defaulting to monthly');
  return 'monthly';
}

// Function to calculate period end date based on plan type
function calculatePeriodEnd(planType: 'monthly' | 'quarterly'): Date {
  const now = new Date();
  const currentPeriodEnd = new Date(now);
  
  if (planType === 'quarterly') {
    currentPeriodEnd.setMonth(now.getMonth() + 3);
  } else {
    currentPeriodEnd.setMonth(now.getMonth() + 1);
  }
  
  return currentPeriodEnd;
}

// Add this function after the other handler functions
async function handleSubscriptionEnded(subscription: any) {
  try {
    if (!subscription || !subscription.id) {
      debug('Invalid subscription data for ended subscription');
      return;
    }
    
    const subscriptionId = subscription.id;
    debug(`Processing fully ended subscription: ${subscriptionId}`);
    
    const { error: endedSubError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        // Ensure cancellation_requested is also set since the subscription has ended
        cancellation_requested: true
      })
      .eq('stripe_subscription_id', subscriptionId);
    
    if (endedSubError) {
      debug('Error updating subscription to canceled:', endedSubError);
    } else {
      debug('Successfully updated subscription to canceled status');
    }
  } catch (error: any) {
    debug('Error processing subscription ended event:', error);
  }
} 