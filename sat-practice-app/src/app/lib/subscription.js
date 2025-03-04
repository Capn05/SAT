import { createClient } from '@/app/lib/supabase/server';

/**
 * Check if a user has an active subscription
 * @param {string} userId - The user ID to check
 * @returns {Promise<Object>} - Object containing subscription status
 */
export async function getUserSubscription(userId) {
  try {
    if (!userId) {
      return {
        isSubscriptionActive: false,
        planType: 'free',
        subscription: null
      };
    }

    const supabase = createClient();
    
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
      return {
        isSubscriptionActive: false,
        planType: 'free',
        subscription: null
      };
    }
    
    // Check if the subscription is active and not expired
    const isSubscriptionActive = subscription && 
      subscription.status === 'active' && 
      subscription.current_period_end > Math.floor(Date.now() / 1000);
    
    return {
      subscription: subscription || null,
      isSubscriptionActive: !!isSubscriptionActive,
      planType: subscription?.plan_type || 'free'
    };
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return {
      isSubscriptionActive: false,
      planType: 'free',
      subscription: null
    };
  }
}

/**
 * Check if a user has access to premium features
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} - Whether the user has premium access
 */
export async function hasPremiumAccess(userId) {
  const { isSubscriptionActive, planType } = await getUserSubscription(userId);
  return isSubscriptionActive && planType === 'premium';
}

/**
 * Check if a user has access to basic or premium features
 * @param {string} userId - The user ID to check
 * @returns {Promise<boolean>} - Whether the user has paid access
 */
export async function hasPaidAccess(userId) {
  const { isSubscriptionActive } = await getUserSubscription(userId);
  return isSubscriptionActive;
} 