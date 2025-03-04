import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request) {
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
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Error fetching subscription' },
        { status: 500 }
      );
    }
    
    // Check if the subscription is active and not expired
    const isSubscriptionActive = subscription && 
      subscription.status === 'active' && 
      subscription.current_period_end > Math.floor(Date.now() / 1000);
    
    return NextResponse.json({
      subscription: subscription || null,
      isSubscriptionActive: !!isSubscriptionActive,
      planType: subscription?.plan_type || 'free'
    });
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return NextResponse.json(
      { error: 'Error retrieving subscription' },
      { status: 500 }
    );
  }
} 