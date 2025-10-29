import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with service role key for bypassing RLS
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

export async function POST(request) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Missing userId or userEmail' }, { status: 400 });
    }

    // Check if email is from approved domains for free access
    const approvedDomains = [ '@knilok.com', '@inupup.com'];
    const isApprovedStudent = approvedDomains.some(domain => userEmail.toLowerCase().endsWith(domain));

    if (!isApprovedStudent) {
      return NextResponse.json({ error: 'Email domain not approved for free subscription' }, { status: 403 });
    }

    // Check if user already has a subscription to avoid duplicates
    const { data: existingSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single();

    // If subscription already exists, return success (idempotent)
    if (existingSubscription) {
      console.log('User already has a subscription, skipping creation');
      return NextResponse.json({ success: true, message: 'Subscription already exists' });
    }

    // Set period end date to October 15th of current year (or next year if we're past Oct 15)
    const currentPeriodEnd = new Date();
    const currentYear = currentPeriodEnd.getFullYear();
    const octDate = new Date(currentYear, 9, 15); // October is month 9 (0-indexed)
    
    // If we're past October 15th this year, set it to October 15th next year
    if (currentPeriodEnd > octDate) {
      octDate.setFullYear(currentYear + 1);
    }
    
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        status: 'active',
        plan_type: 'monthly',
        current_period_end: octDate.toISOString(),
        is_trialing: false,
        trial_end: null,
        cancellation_requested: false
      });

    if (subscriptionError) {
      console.error('Error creating free subscription:', subscriptionError);
      return NextResponse.json({ error: 'Failed to create subscription', details: subscriptionError }, { status: 500 });
    }

    console.log('Free subscription created successfully for approved domain user:', userEmail);
    return NextResponse.json({ success: true, message: 'Free subscription created successfully' });

  } catch (error) {
    console.error('Error in create-free-subscription API:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
