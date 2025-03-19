// Payment utility functions
import { supabase } from './supabase';

// Stripe payment URLs from environment variables
const PAYMENT_LINKS = {
  MONTHLY_PLAN: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/your_monthly_plan_link_here',
  SIX_MONTH_PLAN: process.env.NEXT_PUBLIC_STRIPE_SIX_MONTH_LINK || 'https://buy.stripe.com/your_six_month_plan_link_here'
};

// Check if a user has an active subscription
export const checkSubscription = async (userId) => {
  if (!userId) return { active: false };

  try {
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

    return { 
      active: !!data, 
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
  switch (planType) {
    case 'monthly':
      return PAYMENT_LINKS.MONTHLY_PLAN;
    case 'six_month':
      return PAYMENT_LINKS.SIX_MONTH_PLAN;
    default:
      return PAYMENT_LINKS.MONTHLY_PLAN;
  }
};

// Direct user to appropriate page based on subscription status
export const handleSubscriptionRedirect = async (userId, router) => {
  if (!userId) {
    router.push('/login');
    return;
  }

  const { active } = await checkSubscription(userId);
  
  if (active) {
    router.push('/home');
  } else {
    router.push('/pricing');
  }
}; 