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
    console.log(`Webhook received: ${event.type}`, JSON.stringify(event.data.object, null, 2));
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`, err);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Get a Supabase client for database operations
  const supabase = createRouteHandlerClient({ cookies });

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Extract customer info from the session
        const customerId = session.customer;
        const customerEmail = session.customer_details.email;
        
        console.log(`Processing checkout completion for customer: ${customerEmail}`);
        
        // Get the user associated with this email from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', customerEmail)
          .single();
        
        let userId = userData?.id;
        
        if (userError || !userId) {
          console.error('Error finding user:', userError);
          
          // Try to get user from auth directly
          const { data: authData, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authData || !authData.user) {
            console.error('Could not find user for email:', customerEmail);
            // For testing, we'll proceed anyway with an empty user ID
            // In production, you might want to stop here
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
          }
          
          userId = authData.user.id;
        }
        
        if (!userId) {
          console.error('No user ID found for webhook processing');
          return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
        }
        
        // Determine plan type from session data
        // First check metadata, then check URL, then check line items
        let planType = 'monthly'; // Default to monthly
        
        if (session.metadata && session.metadata.plan_type) {
          planType = session.metadata.plan_type;
          console.log(`Plan type from metadata: ${planType}`);
        } else if (session.success_url && session.success_url.includes('quarterly')) {
          planType = 'quarterly';
          console.log(`Plan type determined from success_url: ${planType}`);
        } else if (session.success_url && session.success_url.includes('monthly')) {
          planType = 'monthly';
          console.log(`Plan type determined from success_url: ${planType}`);
        } else if (session.payment_link) {
          // Check payment link URL
          const monthlyLink = process.env.NEXT_PUBLIC_MONTHLY_PLAN_PAYMENT_LINK || '';
          const quarterlyLink = process.env.NEXT_PUBLIC_QUARTERLY_PLAN_PAYMENT_LINK || '';
          
          console.log(`Payment link: ${session.payment_link}`);
          console.log(`Monthly link: ${monthlyLink}`);
          console.log(`Quarterly link: ${quarterlyLink}`);
          
          if (session.payment_link.includes(quarterlyLink) || session.payment_link.includes('quarterly')) {
            planType = 'quarterly';
            console.log('Plan type determined from payment link URL: quarterly');
          } else {
            planType = 'monthly';
            console.log('Plan type determined from payment link URL: monthly');
          }
        }
        
        // Calculate the current period end date
        const now = new Date();
        let currentPeriodEnd;
        
        if (planType === 'quarterly') {
          currentPeriodEnd = new Date(now);
          currentPeriodEnd.setMonth(now.getMonth() + 3);
        } else {
          currentPeriodEnd = new Date(now);
          currentPeriodEnd.setMonth(now.getMonth() + 1);
        }
        
        console.log(`Storing subscription for user ${userId} with plan type: ${planType}`);
        console.log(`Current period end: ${currentPeriodEnd.toISOString()}`);
        
        // Store subscription info in the database
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
          console.error('Error storing subscription:', subscriptionError);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
        
        console.log('Subscription stored successfully');
        break;
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        
        console.log(`Processing subscription update for: ${subscription.id}`);
        
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
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        
        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }
        
        console.log('Subscription updated successfully');
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
} 