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
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdate(event.data.object);
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
    
    // Determine plan type from various sources
    let planType = determineSubscriptionPlanType(session);
    
    // Calculate the current period end date
    const currentPeriodEnd = calculatePeriodEnd(planType);
    
    debug(`Storing subscription for user ${userId} with plan type: ${planType}`);
    debug(`Current period end: ${currentPeriodEnd.toISOString()}`);
    
    // Store subscription info in the database with better error handling
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: session.subscription || session.id, // Use subscription ID or session ID
        status: 'active',
        plan_type: planType,
        current_period_end: currentPeriodEnd.toISOString(),
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
    
    // Get the user_id from the subscription record
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (subError) {
      debug('Error finding subscription:', subError);
      throw new Error(`Subscription not found: ${subscription.id}`);
    }
    
    // Validate current_period_end is available for updates
    if (subscription.status === 'canceled') {
      // For canceled subscriptions, we don't need to update the period end
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
        })
        .eq('stripe_subscription_id', subscription.id);
      
      if (updateError) {
        debug('Error updating subscription status:', updateError);
        throw new Error(`Database error: ${updateError.message}`);
      }
    } else if (subscription.current_period_end) {
      // Convert Unix timestamp to Date if it's a number
      const periodEndDate = typeof subscription.current_period_end === 'number' 
        ? new Date(subscription.current_period_end * 1000) 
        : new Date(subscription.current_period_end);
      
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_end: periodEndDate.toISOString(),
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
    const monthlyLink = process.env.NEXT_PUBLIC_MONTHLY_PLAN_PAYMENT_LINK || '';
    const quarterlyLink = process.env.NEXT_PUBLIC_QUARTERLY_PLAN_PAYMENT_LINK || '';
    
    debug(`Payment link: ${session.payment_link}`);
    debug(`Monthly link identifier: ${monthlyLink.split('/').pop()}`);
    debug(`Quarterly link identifier: ${quarterlyLink.split('/').pop()}`);
    
    if (session.payment_link.includes(quarterlyLink) || 
        session.payment_link.includes('quarterly')) {
      debug('Plan type determined from payment link URL: quarterly');
      return 'quarterly';
    } else if (session.payment_link.includes(monthlyLink) ||
               session.payment_link.includes('monthly')) {
      debug('Plan type determined from payment link URL: monthly');
      return 'monthly';
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