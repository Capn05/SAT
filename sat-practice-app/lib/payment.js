// Payment utility functions
import { supabase } from './supabase';

// Default payment links (fallbacks if environment variables are not set)
const DEFAULT_LINKS = {
  MONTHLY_PLAN: 'https://buy.stripe.com/test',
  SIX_MONTH_PLAN: 'https://buy.stripe.com/test'
};

// Stripe payment URLs from environment variables with fallbacks
const getPaymentLinks = () => {
  // Only run this in the browser
  if (typeof window === 'undefined') {
    return DEFAULT_LINKS;
  }

  try {
    return {
      MONTHLY_PLAN: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_LINK || DEFAULT_LINKS.MONTHLY_PLAN,
      SIX_MONTH_PLAN: process.env.NEXT_PUBLIC_STRIPE_SIX_MONTH_LINK || DEFAULT_LINKS.SIX_MONTH_PLAN
    };
  } catch (error) {
    console.error('Error getting payment links:', error);
    return DEFAULT_LINKS;
  }
};

// Check if a user has an active subscription
export const checkSubscription = async (userId) => {
  if (!userId) {
    console.log('No user ID provided for subscription check');
    return { active: false };
  }

  try {
    console.log('Checking subscription for user:', userId);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error checking subscription:', error);
      return { active: false, error };
    }

    if (!data) {
      console.log('No active subscription found for user:', userId);
      return { active: false };
    }

    console.log('Active subscription found:', data);
    return { 
      active: true, 
      subscription: data,
      expires: data?.expires_at ? new Date(data.expires_at) : null,
      plan: data?.plan_type || null
    };
  } catch (error) {
    console.error('Error in checkSubscription:', error);
    return { active: false, error };
  }
};

// Get payment link based on plan type
export const getPaymentLink = (planType) => {
  console.log('Getting payment link for plan:', planType);
  const PAYMENT_LINKS = getPaymentLinks();
  
  try {
    switch (planType) {
      case 'monthly':
        return PAYMENT_LINKS.MONTHLY_PLAN;
      case 'six_month':
        return PAYMENT_LINKS.SIX_MONTH_PLAN;
      default:
        console.warn('Unknown plan type, defaulting to monthly:', planType);
        return PAYMENT_LINKS.MONTHLY_PLAN;
    }
  } catch (error) {
    console.error('Error getting payment link:', error);
    return DEFAULT_LINKS.MONTHLY_PLAN;
  }
};

// Direct user to appropriate page based on subscription status
export const handleSubscriptionRedirect = async (userId, router) => {
  console.log('Handling subscription redirect for user:', userId);
  
  if (!userId) {
    console.log('No user ID provided, redirecting to login');
    router.push('/login');
    return;
  }

  try {
    const { active, error } = await checkSubscription(userId);
    
    if (error) {
      console.error('Error checking subscription for redirect:', error);
      // On error, we'll still redirect to pricing to be safe
      router.push('/pricing');
      return;
    }
    
    if (active) {
      console.log('User has active subscription, redirecting to home');
      router.push('/home');
    } else {
      console.log('User has no active subscription, redirecting to pricing');
      router.push('/pricing');
    }
  } catch (error) {
    console.error('Error in handleSubscriptionRedirect:', error);
    router.push('/pricing');
  }
}; 