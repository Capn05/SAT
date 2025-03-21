import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Check if the current user has an active subscription
 * @returns Object with hasActiveSubscription and planType
 */
export async function checkSubscription() {
  const supabase = createClientComponentClient();
  
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { hasActiveSubscription: false, planType: null };
    }
    
    // Get the user's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('status, plan_type, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subscriptionError || !subscription) {
      return { hasActiveSubscription: false, planType: null };
    }
    
    // Check if the subscription is still active (not expired)
    const currentPeriodEnd = new Date(subscription.current_period_end);
    const now = new Date();
    
    if (currentPeriodEnd < now) {
      return { hasActiveSubscription: false, planType: null };
    }
    
    return { 
      hasActiveSubscription: true, 
      planType: subscription.plan_type
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { hasActiveSubscription: false, planType: null };
  }
}

/**
 * Redirect to pricing page if user doesn't have an active subscription
 * @param router Next.js router
 * @returns Promise<boolean> indicating if user was redirected
 */
export async function requireSubscription(router: any): Promise<boolean> {
  const { hasActiveSubscription } = await checkSubscription();
  
  if (!hasActiveSubscription) {
    router.push('/pricing');
    return true;
  }
  
  return false;
} 